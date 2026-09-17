import { test } from "node:test"
import assert from "node:assert"
import { fromMarkdown } from "mdast-util-from-markdown"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import { toString as mdastToString } from "mdast-util-to-string"

import getMetadata, { normalizeHeadingLevels, findTitleNode } from "../plugins/markdown/metadata.js"

/** @param {string} source */
function parse(source) {
  return fromMarkdown(source, {
    extensions: [frontmatter()],
    mdastExtensions: [frontmatterFromMarkdown()]
  })
}

/**
 * Runs the markdown plugin's two tree passes in the order readFile does.
 * @param {string} source
 */
function read(source) {
  const tree = parse(source)
  normalizeHeadingLevels(tree)
  const metadata = getMetadata(tree, "post.md", "post.html")
  const blocks = tree.children.map(child => `${child.type}:${mdastToString(child).slice(0, 24)}`)
  return { metadata, blocks, tree }
}

test("a leading # is the title and is hoisted out of the content", () => {
  const { metadata, blocks } = read("# The Title\n\nBody text.\n")
  assert.equal(metadata.title, "The Title")
  assert.deepEqual(blocks, ["paragraph:Body text."])
})

test("a # that is not in first position is demoted to h2 and stays put", () => {
  const { metadata, tree } = read("Body text.\n\n# Not The Title\n")
  const headings = tree.children.filter(child => child.type === "heading")
  assert.equal(headings.length, 1)
  assert.equal(headings[0].depth, 2)
  // Falls back to the filename, not the heading.
  assert.equal(metadata.title, "Post")
})

test("frontmatter still counts as first position for the title", () => {
  const { metadata, blocks } = read("---\nlayout: page\n---\n\n# The Title\n\nBody.\n")
  assert.equal(metadata.title, "The Title")
  assert.equal(metadata.fm_layout, "page")
  assert.ok(!blocks.some(block => block.startsWith("heading")))
})

test("a leading date is recorded but left where the author put it", () => {
  const { metadata, tree } = read("2026-01-15\n\nBody text.\n")
  assert.equal(new Date(metadata.date).getUTCFullYear(), 2026)
  assert.equal(tree.children.length, 2)
  assert.equal(tree.children[0].type, "paragraph")
})

test("a recognized date is marked up as a time element", () => {
  const { tree } = read("2026-01-15\n\nBody text.\n")
  const [child] = tree.children[0].children
  assert.equal(child.type, "time")
  assert.equal(child.datetime, new Date("2026-01-15").toISOString())
  assert.equal(mdastToString(tree.children[0]), "2026-01-15")
})

test("a date after the title is still recorded", () => {
  // Regression: the old scan spliced the tree while looping over it, so a
  // date written below the heading was neither recorded nor left alone.
  const { metadata, tree } = read("# The Title\n\n2026-01-15\n\nBody text.\n")
  assert.equal(new Date(metadata.date).getUTCFullYear(), 2026)
  assert.equal(tree.children.length, 2)
})

test("hoisting the title takes nothing else with it", () => {
  // The old splice removed every node before the heading as collateral,
  // frontmatter included.
  const { metadata, blocks } = read("---\nlayout: page\n---\n\n# The Title\n\n2026-01-15\n\nBody.\n")
  assert.equal(metadata.title, "The Title")
  assert.deepEqual(blocks, ["yaml:layout: page", "paragraph:2026-01-15", "paragraph:Body."])
})

test("a heading below recognized data is not the title", () => {
  // "First element" is read literally: only frontmatter may precede the
  // title. A date above it means the heading is an ordinary h2.
  const { metadata, tree } = read("2026-01-15\n\n# Not The Title\n\nBody.\n")
  const [heading] = tree.children.filter(child => child.type === "heading")
  assert.equal(heading.depth, 2)
  assert.equal(metadata.title, "Post")
})

test("the scan stops at the first block that is not recognizable data", () => {
  const { metadata } = read("Body text first.\n\n2026-01-15\n")
  assert.equal(metadata.date, undefined)
  assert.equal(metadata.description, "Body text first.")
})

test("frontmatter keys are recorded so derived values are not mistaken for declared ones", () => {
  const { metadata } = read("---\ntitle: FM\n---\n\nBody.\n")
  // selectMetadata sets breadcrumb from the title; it was never declared.
  assert.deepEqual(metadata.frontmatter_keys, ["title"])
  assert.equal(metadata.breadcrumb, "FM")
})

test("findTitleNode ignores a heading that is not first", () => {
  assert.equal(findTitleNode(parse("Body.\n\n# Later\n")), null)
  assert.ok(findTitleNode(parse("# First\n\nBody.\n")))
})

test("a page's date is declared as a date: the value is unchanged and target.types says so", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises")
  const { tmpdir } = await import("node:os")
  const path = await import("node:path")
  const { default: votive } = await import("votive")
  const { createConfig } = await import("../config.js")
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-types-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-types-sys-"))
  let site
  try {
    await writeFile(path.join(sourceFolder, "post.md"), "---\ndate: March 4, 2026\n---\n# Post\n")
    site = await votive(createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    const target = site.database.target.get("post.html")
    assert.equal(target.metadata.date, "2026-03-04T00:00:00.000Z")
    assert.equal(target.types.date, "date")
    assert.equal(target.types.fm_date, "date")
    assert.equal(target.types.title, "text")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
