import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * settings.md contributes what the author declared and nothing inferred.
 * It used to contribute its whole metadata, so a settings.md with no
 * `title:` set the site title to "Settings" (the label inferred from
 * its own filename), and its first paragraph became a description.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-settings-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-settings-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) {
      const full = path.join(sourceFolder, rel)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await run({ site, targetFolder })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("a settings.md with no title: does not name the site after itself", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\n---\n\nSome notes the author keeps here.\n",
    "home.md": "# My Site\n\nWelcome.\n",
    "about.md": "# About\n\nText.\n"
  }, async ({ site, targetFolder }) => {
    const settings = site.database.setting.getByFolder("")
    assert.equal(settings.title, undefined, "no title setting should exist")
    assert.equal(settings.description, undefined)
    assert.equal(settings.inferred_label, undefined)
    assert.equal(settings.inferred_description, undefined)
    assert.deepEqual(settings.fm_domain?.[0], ["example.com"])
    assert.ok(settings.markdown?.[0]?.[0].includes("Some notes"), "the source is still a setting for the panel")

    const about = await readFile(path.join(targetFolder, "about.html"), "utf-8")
    assert.ok(!about.includes("Settings"), "the word Settings leaked into a page")
    assert.match(about, /<title>About - My Site<\/title>/)
  })
})

test("a declared title: in settings.md is the site title", async () => {
  await withSite({
    "settings.md": "---\ntitle: Configured\n---\n",
    "home.md": "# Home\n",
    "about.md": "# About\n"
  }, async ({ site, targetFolder }) => {
    assert.deepEqual(site.database.setting.getByFolder("").title?.[0], ["Configured"])
    const about = await readFile(path.join(targetFolder, "about.html"), "utf-8")
    assert.match(about, /<title>About - Configured<\/title>/)
  })
})
