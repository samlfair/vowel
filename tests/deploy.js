import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { runCommand } from "votive"
import { createConfig } from "../config.js"

test("the deploy command is registered, builds the whole site first, and hands the output folder to wrangler", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-deploy-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-deploy-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const messages = []
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\nDeployed.")
    const config = createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    })

    await assert.rejects(() => runCommand(config, "deploy", undefined), /project name/)

    // No wrangler here: the command builds, then fails to spawn it. The
    // build is the part vowel owns.
    await assert.rejects(
      () => runCommand(config, "deploy", { projectName: "my-site" }, message => messages.push(message)),
      /wrangler/
    )
    await stat(path.join(targetFolder, "index.html"))
    assert.ok(messages.some(m => /Building/.test(m.message)))
    assert.ok(messages.some(m => /Publishing .* to Cloudflare Pages/.test(m.message)))
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

async function withProject(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-publish-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-publish-sys-"))
  try {
    for (const [name, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, name), body)
    const config = createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    })
    await run(config)
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("deploy reads cloudflare_project from the root settings.md; a payload overrides it", async () => {
  await withProject({ "settings.md": "---\ncloudflare_project: from-settings\n---\n", "home.md": "# Home\n" }, async (config) => {
    assert.deepEqual(await runCommand(config, "deploy", { dryRun: true }), { deployed: false, projectName: "from-settings", dryRun: true })
    assert.equal((await runCommand(config, "deploy", { dryRun: true, projectName: "from-payload" })).projectName, "from-payload")
  })
})

test("publish: deploy then AT Protocol; a site with no atproto_did is deployed and nothing more", async () => {
  await withProject({ "settings.md": "---\ncloudflare_project: site\n---\n", "home.md": "# Home\n" }, async (config) => {
    const messages = []
    const result = await runCommand(config, "publish", { dryRun: true }, message => messages.push(message.message))
    assert.deepEqual(result, { cloudflare: { deployed: false, projectName: "site", dryRun: true }, atproto: { skipped: true } })
    assert.ok(messages.findIndex(m => /Would deploy/.test(m)) < messages.findIndex(m => /atproto_did/.test(m)), messages.join("\n"))
  })
})

test("publish: a failed deploy stops before AT Protocol", async () => {
  await withProject({
    // An unreachable PDS: reaching it would fail with another message.
    "settings.md": "---\nname: T\ndomain: example.com\ncloudflare_project: site\natproto_did: did:plc:ewvi7nxzyoun6zhxrhs64oiz\natproto_pds: http://127.0.0.1:9\n---\n",
    "home.md": "# Home\n"
  }, async (config) => {
    const messages = []
    // No wrangler here, so the deploy fails to spawn it.
    await assert.rejects(() => runCommand(config, "publish", undefined, message => messages.push(message.message)), /wrangler/)
    assert.ok(!messages.some(m => /Comparing/.test(m)), "AT Protocol was not reached")
  })
})
