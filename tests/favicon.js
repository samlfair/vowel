import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * Every site has a favicon. Vowel's placeholder, /favicon-placeholder.png,
 * is always published; a page links the `icon` setting, else the
 * project's own favicon.png, else the placeholder.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-favicon-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-favicon-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, rel), body)
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await run({ targetFolder, page: (file) => readFile(path.join(targetFolder, file), "utf-8") })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const VOWEL_FAVICON = path.join(import.meta.dirname, "..", "plugins", "images", "favicon.png")

test("a site with no icon links Vowel's placeholder from every page", async () => {
  await withSite({ "home.md": "# Home\n", "about.md": "# About\n" }, async ({ targetFolder, page }) => {
    const published = await readFile(path.join(targetFolder, "favicon-placeholder.png"))
    assert.deepEqual(published, await readFile(VOWEL_FAVICON), "Vowel's own bytes")
    const { format, width } = await sharp(published).metadata()
    assert.equal(format, "png")
    assert.equal(width, 192)
    for (const file of ["index.html", "about.html"]) {
      assert.match(await page(file), /<link href=\/favicon-placeholder\.png rel=icon type=image\/png>/, file)
    }
    const files = await readdir(targetFolder)
    assert.deepEqual(files.filter(name => name.startsWith("favicon")), ["favicon-placeholder.png"], "just the one file")
  })
})

test("a project's own favicon.png is linked instead", async () => {
  const own = await sharp({ create: { width: 64, height: 64, channels: 4, background: "#ff0000" } }).png().toBuffer()
  await withSite({ "home.md": "# Home\n", "favicon.png": own }, async ({ targetFolder, page }) => {
    assert.deepEqual(await readFile(path.join(targetFolder, "favicon.png")), own)
    assert.match(await page("index.html"), /<link href=\/favicon\.png rel=icon type=image\/png>/)
  })
})

test("with an icon set, the icon is linked, not the placeholder", async () => {
  await withSite({
    "settings.md": "---\nicon: mark.svg\n---\n",
    "home.md": "# Home\n",
    "mark.svg": "<svg xmlns='http://www.w3.org/2000/svg'></svg>"
  }, async ({ targetFolder, page }) => {
    const home = await page("index.html")
    assert.match(home, /<link href=\/mark\.svg rel=icon type=image\/svg\+xml>/)
    assert.doesNotMatch(home, /favicon-placeholder/)
  })
})
