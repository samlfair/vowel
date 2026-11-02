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

test("an alert's own title is kept after its marker; the default one is not written out", () => {
  const titled = roundtrip('<aside class="alert note"><h2>How to render</h2><p>body text</p></aside>')
  assert.equal(titled.markdown, "> [!NOTE] How to render\n>\n> body text")
  const card = roundtrip('<aside class="alert my-card"><h2>My card</h2><p>body text</p></aside>')
  assert.equal(card.markdown, "> [!MY-CARD]\n>\n> body text", "My card is the default for my-card")
})

test("thematic break", () => {
  const { markdown } = roundtrip("<hr>")
  assert.equal(markdown, "---")
})

test("an image leaves the page read-only: its <picture> names only derivatives, never the path the author wrote", () => {
  const { markdown, unrecognised } = roundtrip(
    '<p><picture>' +
    '<source type="image/avif" srcset="/photo-abc-400.avif 400w">' +
    '<img src="/photo-abc-1600.jpg" alt="A photo"></picture></p>'
  )
  assert.equal(markdown, null)
  assert.deepEqual(unrecognised, ["picture"])
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
    { folder: "blog", recursive: false, limit: null, tag: null, view: null, properties: [] },
    { folder: "blog/travel", recursive: true, limit: "5", tag: "design", view: null, properties: [] },
    { folder: "", recursive: false, limit: "3", tag: null, view: null, properties: [] },
    { folder: "ideas", recursive: true, limit: null, tag: null, view: "table", properties: ["title", "description"] }
  ]

  for (const params of cases) {
    const classes = globClasses(params)
    assert.deepEqual(globParams(classes), params, JSON.stringify(params))
    assert.ok(globDirective(globParams(classes)).startsWith("/"))
  }
})

test("frontmatter values round trip by type", () => {
  const { document } = parseHTML(`<main>
    <h1 class="fm_title">The Title</h1>
    <time datetime="2026-03-04T00:00:00.000Z" itemprop="date" class="fm_date">March 4, 2026</time>
    <p itemprop="description" class="fm_description">A description.</p>
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

test("natural metadata - in <main>, no fm_ class - comes back as the lines that made it, in order", () => {
  const { document } = parseHTML(`<main>
    <h1>Natural</h1>
    <time datetime="2026-05-28T00:00:00.000Z" itemprop="date">May 28, 2026</time>
    <img src="/pic.jpg" alt="A picture" itemprop="image">
    <p itemprop="description">The description.</p>
    <dl class="fm_client"><dt>client</dt><dd>Acme</dd></dl>
    <section id="content"><p>The body.</p></section>
  </main>`)

  const frontmatter = readFrontmatter(document.querySelector("main"))
  assert.equal(frontmatter.titleDeclared, false)
  assert.deepEqual(frontmatter.properties, { client: "Acme" }, "only the fm_ ones are frontmatter")
  assert.equal(frontmatter.natural, "May 28, 2026\n\n![A picture](/pic.jpg)\n\nThe description.\n\n---\n\n")

  const { doc } = ingest(document.getElementById("content"), (() => { let n = 0; return () => `n${n++}` })())
  const markdown = serialize(doc, { title: frontmatter.title, natural: frontmatter.natural, properties: { client: "Acme" } })
  assert.equal(markdown, "---\nclient: Acme\n---\n\n# Natural\n\nMay 28, 2026\n\n![A picture](/pic.jpg)\n\nThe description.\n\n---\n\nThe body.\n")
})

test("an image not yet read is a plain <img>, and still comes back", () => {
  const { document } = parseHTML(`<main><h1>T</h1><img src="/pic.jpg" alt="Alt" itemprop="image"><section id="content"></section></main>`)
  assert.equal(readFrontmatter(document.querySelector("main")).natural, "![Alt](/pic.jpg)\n\n")
})

test("a natural image that is a <picture> can't be written back, so it is reported", () => {
  const { document } = parseHTML(`<main><h1>T</h1><picture itemprop="image"><img src="/pic-1.jpg" alt="Alt"></picture><section id="content"></section></main>`)
  const frontmatter = readFrontmatter(document.querySelector("main"))
  assert.equal(frontmatter.natural, "")
  assert.deepEqual(frontmatter.unrecognised, ["picture"])
})

test("a captioned natural image comes back as the image and its caption on one line", () => {
  const { document } = parseHTML(`<main><h1>T</h1><figure><img src="/pic.jpg" alt="Alt" itemprop="image"><figcaption> The <em>caption</em>.</figcaption></figure><section id="content"></section></main>`)
  assert.equal(readFrontmatter(document.querySelector("main")).natural, "![Alt](/pic.jpg) The caption.\n\n")
})

test("a title from the frontmatter is declared: it stays a key, and no heading is written", () => {
  const { document } = parseHTML(`<main><h1 class="fm_title">Declared</h1><section id="content"></section></main>`)
  const { titleDeclared } = readFrontmatter(document.querySelector("main"))
  assert.equal(titleDeclared, true)
})

test("a title from a heading is written back as a heading, not a frontmatter key", () => {
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

test("a table listing in its <figure> is still the directive it came from", () => {
  const classes = globClasses({ folder: "work", recursive: false, view: "table" }).join(" ")
  const { markdown, unrecognised } = roundtrip(
    `<p>Intro.</p><figure><table class="${classes}"><thead><tr><th>title</th></tr></thead><tbody><tr><td>One</td></tr></tbody></table></figure>`
  )
  assert.deepEqual(unrecognised, [])
  assert.equal(markdown, "Intro.\n\n/work/*?view=table")
})
