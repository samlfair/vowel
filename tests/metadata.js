import { test } from "node:test"
import assert from "node:assert"
import { fromMarkdown } from "mdast-util-from-markdown"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import { toString as mdastToString } from "mdast-util-to-string"
import path from "node:path"

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

test("a page with no other date takes the one its path spells", () => {
  const tree = parse("Wednesday\n")
  const metadata = getMetadata(tree, path.join("journal", "2024", "april", "1.md"), path.join("journal", "2024", "april", "1.html"))
  assert.equal(metadata.inferred_date, "2024-04-01T00:00:00.000Z")
  assert.equal(metadata.date, "2024-04-01T00:00:00.000Z")
})

test("a date in the frontmatter or the body wins over the path's", () => {
  const sourcePath = path.join("journal", "2024", "april", "1.md")
  const targetPath = path.join("journal", "2024", "april", "1.html")
  const fromFrontmatter = getMetadata(parse("---\ndate: 2020-05-06\n---\n\nText.\n"), sourcePath, targetPath)
  assert.equal(fromFrontmatter.date, "2020-05-06T00:00:00.000Z")
  assert.equal(fromFrontmatter.inferred_date, undefined)
  const fromBody = getMetadata(parse("2021-07-08\n\nText.\n"), sourcePath, targetPath)
  assert.equal(fromBody.date, "2021-07-08T00:00:00.000Z")
})

test("a secret folder's salt is not read as part of a path date", () => {
  const tree = parse("Text.\n")
  const metadata = getMetadata(tree, path.join("journal", "2024##0412", "04", "12.md"), null)
  assert.equal(metadata.inferred_date, "2024-04-12T00:00:00.000Z")
})

test("one paragraph and then a rule: the paragraph is the description, marked where it is", () => {
  const { metadata, tree } = read("# Title\n\nMay 28, 2026\n\nThe description.\n\n---\n\nThe body begins.\n")
  assert.equal(metadata.description, "The description.")
  assert.equal(metadata.inferred_description, undefined)
  const paragraph = tree.children.find(child => child.type === "paragraph" && mdastToString(child) === "The description.")
  assert.equal(paragraph.data.hProperties.itemprop, "description")
  assert.ok(tree.children.some(child => child.type === "thematicBreak"), "the rule stays")
})

test("without a rule, the first paragraph is the description, as before", () => {
  const { metadata, tree } = read("# Title\n\nThe first paragraph.\n\nThe second.\n")
  assert.equal(metadata.description, "The first paragraph.")
  assert.equal(tree.children.find(child => child.type === "paragraph").data?.hProperties?.itemprop, undefined)
})

test("two paragraphs before the rule: the first is the description, inferred as before, and unmarked", () => {
  const { metadata, tree } = read("# Title\n\nOne.\n\nTwo.\n\n---\n")
  assert.equal(metadata.description, "One.")
  assert.equal(metadata.declared_description, undefined)
  assert.ok(tree.children.every(child => child.data?.hProperties?.itemprop === undefined))
})

test("a paragraph above a rule outranks a slogan; frontmatter's description outranks both, and the paragraph isn't marked", () => {
  const slogan = read("---\nslogan: A slogan\n---\n# Title\n\nThe description.\n\n---\n")
  assert.equal(slogan.metadata.description, "The description.")
  const declared = read("---\ndescription: From frontmatter\n---\n# Title\n\nA paragraph.\n\n---\n")
  assert.equal(declared.metadata.description, "From frontmatter")
  const paragraph = declared.tree.children.find(child => child.type === "paragraph")
  assert.equal(paragraph.data?.hProperties?.itemprop, undefined)
})

test("text then --- on the next line is a heading, not a description and a rule", () => {
  const { metadata, tree } = read("# Title\n\nNot a description\n---\n\nBody.\n")
  assert.equal(metadata.declared_description, undefined)
  assert.ok(tree.children.some(child => child.type === "heading" && child.depth === 2))
})

test("a property the frontmatter declares is filled: its line in the text is content, and the scan stops there", () => {
  const dated = read("---\ndate: 2020-01-01\n---\n# Title\n\nMay 28, 2026\n\nA paragraph.\n\n---\n")
  assert.equal(dated.metadata.date, "2020-01-01T00:00:00.000Z")
  assert.equal(dated.metadata.inferred_date, undefined)
  assert.equal(dated.metadata.declared_description, undefined, "the scan stopped at the date line")
  assert.ok(dated.tree.children.every(child => !child.data?.hProperties?.dataMetadata), "nothing is natural metadata")

  const pictured = read("---\nimage: /cover.jpg\n---\n# Title\n\n![Alt](other.jpg)\n\nMay 28, 2026\n")
  assert.equal(pictured.metadata.inferred_image, undefined)
  assert.equal(pictured.metadata.inferred_date, undefined, "the scan stopped at the image")
})

test("a second date line is content: the property is already filled", () => {
  const { metadata, tree } = read("# Title\n\nMay 28, 2026\n\nJune 1, 2026\n")
  assert.equal(metadata.date, "2026-05-28T00:00:00.000Z")
  const marked = tree.children.filter(child => child.data?.hProperties?.dataMetadata).map(child => child.data.hProperties.dataMetadata)
  assert.deepEqual(marked, ["date"])
})

test("natural metadata is marked for the html plugin to lift out: date, image, description, and the rule that ended it", () => {
  const { tree } = read("# Title\n\nMay 28, 2026\n\n![Alt](pic.jpg)\n\nThe description.\n\n---\n\nBody.\n")
  const marked = tree.children.filter(child => child.data?.hProperties?.dataMetadata).map(child => child.data.hProperties.dataMetadata)
  assert.deepEqual(marked, ["date", "image", "description", "end"])
})
