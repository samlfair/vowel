import { test } from "node:test"
import assert from "node:assert"
import { parseHTML } from "linkedom"

import ingest from "../plugins/html/editor/ingest.js"
import serialize from "../plugins/html/editor/serialize.js"
import readFrontmatter from "../plugins/html/editor/frontmatter.js"
import { globClasses, dirClasses, folderFromClasses, globParams, globDirective } from "../plugins/html/editor/directives.js"

/**
 * Ingests a #content fragment and serializes it straight back, which is
 * the whole round trip the editor performs on save.
 * @param {string} html
 */
function roundtrip(html) {
  const { document } = parseHTML(`<section id="content">${html}</section>`)
  const content = document.getElementById("content")

  const counter = { value: 0 }
  const generateId = () => `n${counter.value++}`

  const { doc, unrecognised } = ingest(content, generateId)
  if (!doc) return { markdown: null, unrecognised }

  return { markdown: serialize(doc).trim(), unrecognised }
}

test("paragraphs and inline marks", () => {
  const { markdown } = roundtrip(
    "<p>plain <strong>bold</strong> and <em>italic</em> and <code>code</code></p>"
  )
  assert.equal(markdown, "plain **bold** and _italic_ and `code`")
})

test("escapes markdown syntax that was literal text", () => {
  const { markdown } = roundtrip("<p>a * star and a _score</p>")
  assert.equal(markdown, "a \\* star and a \\_score")
})

test("links carry their href", () => {
  const { markdown } = roundtrip('<p>see <a href="/blog">the blog</a></p>')
  assert.equal(markdown, "see [the blog](/blog)")
})

test("highlight and strikethrough round trip", () => {
  const { markdown } = roundtrip("<p><mark>hi</mark> and <del>gone</del></p>")
  assert.equal(markdown, "==hi== and ~~gone~~")
})

test("nested marks flatten outermost-wins", () => {
  // Svedit marks are mutually exclusive, so the inner em is dropped and
  // its text is kept. This is lossy by decision, not by accident.
  const { markdown } = roundtrip("<p><strong>bold <em>and italic</em></strong></p>")
  assert.equal(markdown, "**bold and italic**")
})

test("headings keep their level", () => {
  const { markdown } = roundtrip('<h2 id="slug">Title</h2><h3>Sub</h3>')
  assert.equal(markdown, "## Title\n\n### Sub")
})

test("lists", () => {
  const { markdown } = roundtrip("<ul><li>one</li><li>two</li></ul>")
  assert.equal(markdown, "- one\n- two")
})

test("ordered lists", () => {
  const { markdown } = roundtrip("<ol><li>one</li><li>two</li></ol>")
  assert.equal(markdown, "1. one\n2. two")
})

test("code blocks drop the highlighter's span tree", () => {
  const { markdown } = roundtrip(
    '<pre><code class="hljs language-js"><span class="hljs-keyword">const</span> x = 1</code></pre>'
  )
  assert.equal(markdown, "```js\nconst x = 1\n```")
})

test("blockquotes", () => {
  const { markdown } = roundtrip("<blockquote><p>quoted</p></blockquote>")
  assert.equal(markdown, "> quoted")
})

test("alerts rebuild their marker from the class", () => {
  const { markdown } = roundtrip(
    '<aside class="alert note"><h2>Note</h2><p>body text</p></aside>'
  )
  assert.equal(markdown, "> [!NOTE]\n>\n> body text")
})

test("thematic break", () => {
  const { markdown } = roundtrip("<hr>")
  assert.equal(markdown, "---")
})

test("images come back from data-original, not the derivative paths", () => {
  const { markdown } = roundtrip(
    '<p><picture data-original="/photo.jpg">' +
    '<source type="image/avif" srcset="/photo-abc-400.avif 400w">' +
    '<img src="/photo-abc-1600.jpg" alt="A photo"></picture></p>'
  )
  assert.equal(markdown, "![A photo](/photo.jpg)")
})

test("a glob expansion collapses back to its directive", () => {
  const classes = globClasses({ folder: "blog", recursive: true, limit: 5, tag: "design" }).join(" ")
  const { markdown } = roundtrip(
    `<ul class="${classes}"><li><article><a href="/blog/a"><h1>A</h1></a></article></li></ul>`
  )
  assert.equal(markdown, "/blog/**?count=5&tag=design")
})

test("a reference card collapses back to its path", () => {
  const { markdown } = roundtrip(
    '<article class="reference"><a href="/blog/post"><h1>Post</h1></a></article>'
  )
  assert.equal(markdown, "/blog/post")
})

test("a link preview collapses back to its url", () => {
  const { markdown } = roundtrip(
    '<article class="link-preview"><a href="https://example.com"><h2>Example</h2></a></article>'
  )
  assert.equal(markdown, "https://example.com")
})

test("unrecognised elements fail the whole ingest", () => {
  const { markdown, unrecognised } = roundtrip("<p>fine</p><section class='mystery'>?</section>")
  assert.equal(markdown, null)
  assert.deepEqual(unrecognised, ["section.mystery"])
})

test("a whole document", () => {
  const { markdown } = roundtrip(
    "<h2>Title</h2>" +
    "<p>Some <strong>bold</strong> prose.</p>" +
    "<ul><li>one</li><li>two</li></ul>" +
    "<hr>"
  )
  assert.equal(markdown, "## Title\n\nSome **bold** prose.\n\n- one\n- two\n\n---")
})

test("directive classes round trip", () => {
  for (const folder of ["", "blog", "blog/travel", "a/b/c", "my_notes", "my-blog"]) {
    assert.equal(folderFromClasses(dirClasses(folder)), folder, folder)
  }
})

test("glob directives round trip", () => {
  const cases = [
    { folder: "blog", recursive: false, limit: null, tag: null },
    { folder: "blog/travel", recursive: true, limit: "5", tag: "design" },
    { folder: "", recursive: false, limit: "3", tag: null }
  ]

  for (const params of cases) {
    const classes = globClasses(params)
    assert.deepEqual(globParams(classes), params, JSON.stringify(params))
    assert.ok(globDirective(globParams(classes)).startsWith("/"))
  }
})

test("frontmatter values round trip by type", () => {
  const { document } = parseHTML(`<main>
    <h1>The Title</h1>
    <time datetime="2026-03-04T00:00:00.000Z" itemprop="date">March 4, 2026</time>
    <p itemprop="description">A description.</p>
    <dl><dt>tags</dt><dd><ul><li>design</li><li>code</li></ul></dd></dl>
    <dl><dt>author</dt><dd><dl><dt>name</dt><dd>Sam</dd><dt>url</dt><dd><a href="https://example.com">https://example.com</a></dd></dl></dd></dl>
    <dl><dt>count</dt><dd>5</dd></dl>
    <dl><dt>draft</dt><dd>true</dd></dl>
    <section id="content"><p>Body.</p></section>
  </main>`)

  const { title, properties } = readFrontmatter(document.querySelector("main"))

  assert.equal(title, "The Title")
  assert.deepEqual(properties, {
    // Midnight UTC comes back as a plain date, not an ISO timestamp.
    date: "2026-03-04",
    description: "A description.",
    tags: ["design", "code"],
    author: { name: "Sam", url: "https://example.com" },
    count: 5,
    draft: true
  })
})

test("the title is written as a heading, never as a frontmatter key", () => {
  const { document } = parseHTML('<section id="content"><p>Body.</p></section>')
  let n = 0
  const { doc } = ingest(document.getElementById("content"), () => `n${n++}`)

  const markdown = serialize(doc, { title: "The Title", properties: { layout: "page" } })
  assert.equal(markdown, "---\nlayout: page\n---\n\n# The Title\n\nBody.\n")
})

test("a page with no frontmatter emits no fence", () => {
  const { document } = parseHTML('<section id="content"><p>Body.</p></section>')
  let n = 0
  const { doc } = ingest(document.getElementById("content"), () => `n${n++}`)

  assert.equal(serialize(doc, { title: null, properties: {} }), "Body.\n")
})

test("a date left in the body survives as plain text", () => {
  const { markdown } = roundtrip('<p><time datetime="2026-01-15T00:00:00.000Z">2026-01-15</time></p>')
  assert.equal(markdown, "2026-01-15")
})
