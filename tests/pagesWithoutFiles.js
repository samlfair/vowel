import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * `html_file: false` writes no file, but the page is still a page:
 * listed wherever it can be without a link to it - a listing's card,
 * a single card, a table row, the feed - and nowhere that is a link:
 * the sitemap, the navs.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-nofile-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-nofile-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
      await writeFile(path.join(sourceFolder, rel), body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    const page = (file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8")
    const exists = (file) => access(path.join(targetFolder, ...file.split("/"))).then(() => true, () => false)
    await run({ page, exists })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const content = (html) => html.match(/<section id=content>[\s\S]*?<\/section>/)[0]

const site = {
  "settings.md": "---\ndomain: example.com\n---\n",
  "home.md": "# Home\n\n/work/*\n\n/work/ghost\n\n/work/*?view=table\n",
  "about.md": "# About\n",
  "contact.md": "# Contact\n",
  "work/real.md": "---\ndate: 2026-01-02\n---\n# Real\n\nA real page.\n",
  "work/ghost.md": "---\nhtml_file: false\ndate: 2026-01-03\n---\n# Ghost\n\nNo page of its own.\n",
  "work/gone.md": "---\nstatus: deleted\ndate: 2026-01-04\n---\n# Gone\n"
}

test("a page without a file has none, and is a card that links nowhere", async () => {
  await withSite(site, async ({ page, exists }) => {
    assert.equal(await exists("work/ghost.html"), false)
    const home = content(await page("index.html"))
    const listing = home.match(/<ul class="_ _work">[\s\S]*?<\/ul>/)[0]
    assert.match(listing, /<li><article class="folder_work page_work_ghost"itemscope><h1>Ghost<\/h1>/, "in the listing, unlinked")
    assert.match(listing, /<a href=\/work\/real><article/, "the real page is linked as before")
    assert.doesNotMatch(home, /href=\/work\/ghost/, "nothing links to it")
    assert.match(home, /<\/ul>\s*<article class="folder_work page_work_ghost"itemscope>/, "the single card is an unlinked article")
    assert.match(home, /<td>Ghost(<\/td>)?<tr>/, "a table row with its title as text")
    assert.doesNotMatch(home, /Gone/, "a deleted page is not a page without a file")
  })
})

test("it is a feed entry, with its body and no link", async () => {
  await withSite(site, async ({ page }) => {
    const feed = await page("feed.xml")
    const entry = feed.match(/<entry>(?:(?!<\/entry>)[\s\S])*Ghost[\s\S]*?<\/entry>/)?.[0]
    assert.ok(entry, `an entry: ${feed}`)
    assert.match(entry, /No page of its own/, "with its body")
    assert.doesNotMatch(entry, /<link/, "and no link")
    assert.match(entry, /<id>https?:\/\/example\.com\/work\/ghost\.html<\/id>/, "its id is the url it would have")
  })
})

test("it is not in the sitemap, the header nav or the aside", async () => {
  await withSite({ ...site, "ghostly.md": "---\nhtml_file: false\n---\n# Ghostly\n" }, async ({ page }) => {
    assert.doesNotMatch(await page("sitemap.xml"), /ghost/)
    const about = await page("about.html")
    assert.doesNotMatch(about.match(/<header>[\s\S]*?<\/header>/)[0], /Ghostly/)
    assert.doesNotMatch(about.match(/<aside>[\s\S]*?<\/aside>/)[0], /Ghost/)
  })
})

test("a folder of pages without files still gets its index, which lists them", async () => {
  await withSite({
    "home.md": "# Home\n",
    "cards/one.md": "---\nhtml_file: false\n---\n# One\n",
    "cards/two.md": "---\nhtml_file: false\n---\n# Two\n"
  }, async ({ page }) => {
    const index = content(await page("cards.html"))
    assert.match(index, /<h1>One<\/h1>/)
    assert.match(index, /<h1>Two<\/h1>/)
  })
})

test("published: false is no longer a key vowel reads: the page is written", async () => {
  await withSite({ "home.md": "# Home\n", "old.md": "---\npublished: false\n---\n# Old\n" }, async ({ exists }) => {
    assert.equal(await exists("old.html"), true)
  })
})
