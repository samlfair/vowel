import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * Metadata written in the text - a date line, an image, a description
 * ended with a rule - is rendered as a direct child of <main>, out of
 * section#content, like its frontmatter equivalent; the frontmatter's
 * carry their key as an `fm_` class, the text's carry none. The source
 * is never changed.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-natural-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-natural-sys-"))
  let site
  try {
    await sharp({ create: { width: 300, height: 200, channels: 3, background: "#336699" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))
    for (const [rel, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, rel), body)
    site = await votive(createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await run((file) => readFile(path.join(systemFolder, "output", file), "utf-8"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const head = (html) => html.match(/<main[\s\S]*?<section id=content>/)[0]
const content = (html) => html.match(/<section id=content>[\s\S]*?<\/section>/)[0]

const files = {
  "settings.md": "---\ndomain: example.com\n---\n",
  "home.md": "# Home\n",
  "natural.md": "# Natural\n\nMay 28, 2026\n\n![A picture](pic.jpg)\n\nThe description.\n\n---\n\nThe body.\n",
  "declared.md": "---\ndate: 2026-01-02\ndescription: From frontmatter\n---\n# Declared\n\nMay 28, 2026\n\nThe first paragraph.\n\n---\n\nThe body.\n"
}

test("natural metadata is lifted into <main>, without fm_ classes, and the rule after a description is gone", async () => {
  await withSite(files, async (page) => {
    const html = await page("natural.html")
    assert.match(head(html), /<time datetime=2026-05-28T00:00:00\.000Z itemprop=date>May 28, 2026<\/time>/, "the date, as written")
    assert.match(head(html), /<picture data-original=\/pic\.jpg[^>]*itemprop=image[^>]*>/)
    assert.match(head(html), /<p itemprop=description>The description\./)
    assert.doesNotMatch(head(html), /fm_/)
    assert.doesNotMatch(content(html), /May 28|A picture|The description|<hr>/, "none of it is content")
    assert.match(content(html), /The body\./)
  })
})

test("frontmatter's carry their key as a class; the text's line for a declared property stays content", async () => {
  await withSite(files, async (page) => {
    const html = await page("declared.html")
    assert.match(head(html), /<time datetime=2026-01-02T00:00:00\.000Z itemprop=date class=fm_date>/)
    assert.match(head(html), /<p class=fm_description itemprop=description>From frontmatter/)
    assert.match(content(html), /<p>May 28, 2026/, "the date line is content")
    assert.match(content(html), /<p>The first paragraph\.[\s\S]*<hr>/, "and so is the paragraph, and its rule")
  })
})

test("the feed's entry body is the content alone: no date line or description repeated", async () => {
  await withSite(files, async (page) => {
    const feed = await page("feed.xml")
    const entry = feed.match(/<entry>(?:(?!<\/entry>)[\s\S])*Natural[\s\S]*?<\/entry>/)[0]
    assert.match(entry, /<summary>The description\.<\/summary>/)
    const body = entry.match(/<content[\s\S]*?<\/content>/)[0]
    assert.match(body, /The body\./)
    assert.doesNotMatch(body, /May 28|The description/)
  })
})
