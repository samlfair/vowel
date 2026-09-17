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

async function withSite(files, run, overrides = {}) {
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
      logging: "silent",
      ...overrides
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

test("a declared name: in settings.md is the site name: the header shows the root's, <title> appends every folder's, leaf first", async () => {
  await withSite({
    "settings.md": "---\nname: Site\ntagline: Small things\n---\n",
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "shop/settings.md": "---\nname: Shop\n---\n",
    "shop/hats.md": "# Hats\n",
    "shop/hats/red.md": "# Red\n"
  }, async ({ site, targetFolder }) => {
    assert.deepEqual(site.database.setting.getByFolder("").fm_name?.[0], ["Site"])
    assert.equal(site.database.setting.getByFolder("").title, undefined)

    const page = (file) => readFile(path.join(targetFolder, file), "utf-8")
    assert.match(await page("index.html"), /<title>Site - Small things<\/title>/)
    assert.match(await page("about.html"), /<title>About - Site<\/title>/)
    assert.match(await page(path.join("shop", "hats.html")), /<title>Hats - Shop - Site<\/title>/)
    assert.match(await page(path.join("shop", "hats", "red.html")), /<title>Red - Shop - Site<\/title>/)

    // The header names the site everywhere, not the section.
    for (const file of ["about.html", path.join("shop", "hats.html")]) {
      assert.match(await page(file), /<a id=title href=\/ rel=home>Site<\/a>/)
    }
  })
})

test("title: in a settings.md is an old spelling: it sets nothing and is warned about", async () => {
  const warnings = []
  await withSite({
    "settings.md": "---\ntitle: Old\n---\n",
    "home.md": "# My Site\n",
    "about.md": "# About\n"
  }, async ({ site, targetFolder }) => {
    assert.equal(site.database.setting.getByFolder("").title, undefined)
    assert.deepEqual(site.database.setting.getByFolder("").fm_title?.[0], ["Old"], "still stored, read by nothing")
    // The site name falls back to the homepage's title.
    assert.match(await readFile(path.join(targetFolder, "about.html"), "utf-8"), /<title>About - My Site<\/title>/)
  }, { log: (level, message) => warnings.push([level, message]) })
  assert.ok(warnings.some(([level, message]) => level === "warn" && /title:.*name:/.test(message)), JSON.stringify(warnings))
})
