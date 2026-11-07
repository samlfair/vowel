import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { headingAnchor } from "../plugins/html/headingIds.js"

/**
 * A heading's id is `heading_` and its slug (plugins/html/headingIds.js),
 * so a heading can never take one of the page's own ids, and the anchors
 * an author writes follow it.
 */

async function build(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-ids-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-ids-sys-"))
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
      await writeFile(path.join(sourceFolder, rel), body)
    }
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await site.close()
    await run((file) => readFile(path.join(targetFolder, file), "utf-8"))
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("a heading's id is prefixed, so a heading called Content is not section#content", async () => {
  await build({
    "home.md": "# Home\n\n## Content\n\nText.[^1]\n\n## Kerning\n\nSee [content](#content), [kerning](#kerning), [the section](#heading_kerning) and [the post's](./post.md#spacing).\n\n[^1]: A note.\n",
    "post.md": "# Post\n\n## Spacing\n"
  }, async (page) => {
    const home = await page("index.html")
    assert.equal(home.match(/id=content\b/g)?.length, 1, "one element is #content: the section")
    assert.match(home, /<h2 id=heading_content>Content<\/h2>/)
    assert.match(home, /<h2 id=heading_kerning>Kerning<\/h2>/)
    assert.match(home, /<a href=#content>content<\/a>/, "the page's own id is left alone")
    assert.match(home, /<a href=#heading_kerning>kerning<\/a>/, "an anchor an author wrote is the heading's")
    assert.match(home, /<a href=#heading_kerning>the section<\/a>/, "written with the prefix, it is kept")
    assert.match(home, /<a href=\/post#heading_spacing>the post's<\/a>/, "and on another page")
    assert.match(home, /href=#user-content-fn-1/, "a footnote's anchor is GFM's, untouched")
    assert.match(home, /<a href=#heading_kerning>Kerning<\/a>/, "the contents link the prefixed ids")
  })
})

test("a file's anchor is not a heading's", async () => {
  await build({
    "home.md": "# Home\n\n[The guide](./guide.pdf#page=2)\n",
    "guide.pdf": "%PDF-1.4\n"
  }, async (page) => {
    assert.match(await page("index.html"), /href="?\/guide\.pdf#page=2"?>/)
  })
})

test("headingAnchor: the page's own ids, footnotes' and already-prefixed ones are kept", () => {
  assert.equal(headingAnchor("kerning"), "heading_kerning")
  assert.equal(headingAnchor("heading_kerning"), "heading_kerning")
  for (const id of ["content", "backlinks", "logo", "title", "copyright", "user-content-fn-1", "footnote-label"]) {
    assert.equal(headingAnchor(id), id)
  }
})
