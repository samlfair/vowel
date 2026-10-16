import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { stripVTControlCharacters } from "node:util"
import votive from "votive"
import { createConfig } from "../config.js"
import { secretRouter } from "../secretPaths.js"

/**
 * A project built with `overrides`; `lines` is what the build printed
 * with console.info, colour stripped.
 */
async function withSite(files, overrides, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-secrets-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-secrets-sys-"))
  const lines = []
  const info = console.info
  console.info = (message) => lines.push(stripVTControlCharacters(String(message)))
  const site = await votive(createConfig(sourceFolder, {
    targetFolder: path.join(systemFolder, "output"),
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "essential",
    urlHostInterval: 0,
    ...overrides
  }))
  try {
    const write = async (relative, body) => {
      await mkdir(path.dirname(path.join(sourceFolder, relative)), { recursive: true })
      await writeFile(path.join(sourceFolder, relative), body)
    }
    for (const [relative, body] of Object.entries(files)) await write(relative, body)
    const build = async () => { await (await site.build({ defer: false })).deferred }
    await build()
    await run({ lines, build, write })
  } finally {
    console.info = info
    await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const FILES = {
  "settings.md": "---\nname: T\ndomain: example.com\n---\n",
  "public.md": "# Public\n",
  "members##salt/welcome.md": "# Welcome\n",
  "draft##pepper.md": "# Draft\n",
  "quiet.md": "---\nstatus: hidden\n---\n# Quiet\n"
}

/** The url vowel's router gives a source, as the log prints it. */
const urlOf = (source) => `https://example.com/${secretRouter(source).toLowerCase().replace(/\.md$/, "")}`

const secretLines = (lines) => lines.filter(line => line.startsWith("secret:"))

test("the dev server prints each secret page, file and url, once", async () => {
  await withSite(FILES, { announceSecretPages: true }, async ({ lines, build }) => {
    // As a set: a folder's index is made in a later round of the same build than its pages.
    assert.deepEqual(secretLines(lines).sort(), [
      `secret: draft##pepper.md → ${urlOf("draft##pepper.md")}`,
      `secret: members##salt.md → ${urlOf("members##salt.md")}`,
      `secret: ${path.join("members##salt", "welcome.md")} → ${urlOf("members##salt/welcome.md")}`
    ].sort(), "the secret folder's own index too: the url to share for the whole folder")
    assert.ok(!lines.some(line => line.includes("quiet") || line.includes("public")), "a page that is only hidden, or public, isn't a secret")

    await build()
    assert.equal(secretLines(lines).length, 3, "not again on the next pass")
  })
})

test("a new secret page is printed when it appears", async () => {
  await withSite(FILES, { announceSecretPages: true }, async ({ lines, build, write }) => {
    await write("members##salt/new.md", "# New\n")
    await build()
    assert.equal(secretLines(lines).at(-1), `secret: ${path.join("members##salt", "new.md")} → ${urlOf("members##salt/new.md")}`)
  })
})

test("nothing is printed unless the dev server asks - never from a build that deploys or publishes - or when silent", async () => {
  await withSite(FILES, {}, async ({ lines }) => {
    assert.deepEqual(secretLines(lines), [])
  })
  await withSite(FILES, { announceSecretPages: true, logging: "silent" }, async ({ lines }) => {
    assert.deepEqual(secretLines(lines), [])
  })
})
