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
