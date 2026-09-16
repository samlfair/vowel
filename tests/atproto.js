import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { validDID } from "../plugins/atproto/index.js"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, rel), body)
    site = await votive(createConfig(sourceFolder, {
      targetFolder, databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"), logging: "silent", urlHostInterval: 0
    }))
    const rebuild = async () => { await (await site.build()).deferred }
    await rebuild()
    const wellKnown = path.join(targetFolder, ".well-known", "atproto-did")
    const exists = () => access(wellKnown).then(() => true, () => false)
    await run({ sourceFolder, rebuild, wellKnown, exists })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("validDID accepts did:plc and did:web and nothing that is not a DID", () => {
  assert.equal(validDID("did:plc:ewvi7nxzyoun6zhxrhs64oiz"), true)
  assert.equal(validDID("did:web:littlefair.ca"), true)
  assert.equal(validDID("littlefair.ca"), false)
  assert.equal(validDID("did:plc"), false)
  assert.equal(validDID(42), false)
})

test("atproto.did in settings.md is served at /.well-known/atproto-did, and removing it removes the file", async () => {
  await withSite({
    "settings.md": "---\natproto:\n  did: did:plc:ewvi7nxzyoun6zhxrhs64oiz\n---\n",
    "home.md": "# Home"
  }, async ({ sourceFolder, rebuild, wellKnown, exists }) => {
    assert.equal(await readFile(wellKnown, "utf-8"), "did:plc:ewvi7nxzyoun6zhxrhs64oiz")

    await writeFile(path.join(sourceFolder, "settings.md"), "---\ntitle: T\n---\n")
    await rebuild()
    assert.equal(await exists(), false, "no did, no file: a stub that stops being declared takes its file with it")
  })
})

test("a site with no atproto block produces no well-known file, and a malformed did fails loudly", async () => {
  await withSite({ "home.md": "# Home" }, async ({ exists }) => {
    assert.equal(await exists(), false)
  })
  await assert.rejects(
    () => withSite({ "settings.md": "---\natproto:\n  did: littlefair.ca\n---\n", "home.md": "# Home" }, async () => {}),
    /atproto\.did must look like/
  )
})
