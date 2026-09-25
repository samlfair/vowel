import { test } from "node:test"
import assert from "node:assert"
import { toHtml } from "hast-util-to-html"
import plugin from "../plugins/markdown/index.js"

const [processor] = plugin.processors
const config = { sourceFolder: process.cwd(), targetFolder: "/tmp/vowel-test-out" }
const api = { createTarget: () => {}, url: { get: () => null, create: () => {} } }

/**
 * Runs a document through the markdown processor and compiles the result,
 * which is what a real build does - the failure this covers only appears
 * at compile time, not while the tree is being built.
 * @param {string} markdown
 */
function render(markdown) {
  const source = {
    path: "page.md",
    target: "page.html",
    text: markdown,
    buffer: () => Buffer.from(markdown)
  }

  // The hook takes (subject, context), and the parsed tree now rides in
  // metadata as the hastAbstract convention rather than being a column.
  const result = processor.readFile(source, { api, settings: undefined, config })
  return { html: toHtml(result.metadata.hastAbstract), metadata: result.metadata }
}

test("dates: markup around a date disqualifies it as metadata", () => {
  // A date is a property of the page only when the author wrote it as
  // the whole paragraph and nothing else. Wrapped in anything, the
  // paragraph is prose that happens to contain a date.
  for (const [label, markdown, tag] of [
    ["strong", "# T\n\n**March 4, 2026**\n", "strong"],
    ["emphasis", "# T\n\n*March 4, 2026*\n", "em"],
    ["link", "# T\n\n[March 4, 2026](/x)\n", "a"],
    ["inline code", "# T\n\n`March 4, 2026`\n", "code"]
  ]) {
    const { html, metadata } = render(markdown)

    assert.ok(!html.includes("<time"), `a date in ${label} was still marked up as a time`)
    assert.equal(metadata.inferred_date, undefined, `a date in ${label} was still recorded`)
    assert.match(html, new RegExp(`<${tag}[ >]`), `the ${label} itself was lost`)
  }
})

test("dates: a bare date is still recorded and marked up in place", () => {
  const { html, metadata } = render("# T\n\n2026-03-04\n")

  assert.match(html, /<time datetime="2026-03-04T00:00:00\.000Z">2026-03-04<\/time>/)
  // The hook's own return carries the type declaration; votive unwraps it
  // at the write, so a page reads back the plain ISO string.
  assert.deepEqual(metadata.inferred_date, { $type: "date", $value: "2026-03-04T00:00:00.000Z" })
})

test("dates: a date with siblings in the paragraph is prose", () => {
  const { html, metadata } = render("# T\n\nPublished on 2026-03-04 by us.\n")

  assert.ok(!html.includes("<time"))
  assert.equal(metadata.inferred_date, undefined)
})

test("inline markup: a highlight containing markup compiles and keeps it", () => {
  // toHast's unknownHandler has to convert its children with
  // state.all(node) rather than passing mdast straight into a hast
  // element. Text survives that by coincidence - mdast and hast spell a
  // text node identically - so only marked-up content shows the bug, and
  // `highlight` is now the only custom node that can hold any.
  const { html } = render("# T\n\nsome ==marked **bold** text== here\n")
  assert.match(html, /<mark>marked <strong>bold<\/strong> text<\/mark>/)
})

test("inline markup: every custom node compiles to real HTML", () => {
  // The failure this guards is invisible until compile time: the tree
  // builds happily and hast-util-to-html is what throws.
  for (const markdown of [
    "# T\n\n2026-03-04\n",
    "# T\n\nsome ==marked **bold** text== here\n",
    "# T\n\n==a ***nested*** highlight==\n",
    "# T\n\n**Just bold.**\n"
  ]) {
    assert.doesNotThrow(() => render(markdown), markdown)
  }
})

test("inline markup: bold that is not a date is left alone", () => {
  const { html } = render("# T\n\n**Just bold.**\n")

  assert.match(html, /<p><strong>Just bold\.<\/strong><\/p>/)
  assert.ok(!html.includes("<time"))
})

test("hashtags: recorded from every paragraph, linked in place with the hashtag class, embedded in prose, never in code", () => {
  const { html, metadata } = render("# T\n\nFirst #one here.\n\n#two #three\n\n`not #four` and [#five](/x)\n\n```\n#six\n```\n")

  assert.deepEqual(metadata.tags, ["one", "two", "three"])
  assert.match(html, /First <a href="\/tags\/one" class="hashtag">#one<\/a> here\./)
  assert.match(html, /<a href="\/tags\/two" class="hashtag">#two<\/a> <a href="\/tags\/three" class="hashtag">#three<\/a>/)
  assert.match(html, /<code>not #four<\/code>/)
  assert.match(html, /<a href="\/x">#five<\/a>/)
  assert.match(html, /<code>#six\n<\/code>/)
})

test("tags: frontmatter tags and hashtags are one list, frontmatter first, each once, a leading # dropped", () => {
  const { metadata } = render("---\ntags: [design, '#events', ' ']\n---\n# T\n\nNotes. #events #travel\n")
  assert.deepEqual(metadata.tags, ["design", "events", "travel"])
})

test("tags: a single frontmatter tag is a tag", () => {
  const { metadata } = render("---\ntags: design\n---\n# T\n\nNo hashtags here.\n")
  assert.deepEqual(metadata.tags, ["design"])
})

test("hashtags: a page with none records no tags", () => {
  const { metadata } = render("# T\n\nJust prose, and a url https://x.com/#top\n")
  assert.equal(metadata.tags, undefined)
})
