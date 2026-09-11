import { test } from "node:test"
import assert from "node:assert"
import { entryContent } from "../plugins/xml/entryContent.js"

/** A rendered page, in the shape the html plugin actually produces. */
const page = (content) => `<!doctypehtml><html lang=en><meta charset=UTF-8>`
  + `<title>Post - Site</title><link rel=stylesheet href=/styles.css?abc12345>`
  + `<body class=post><header><a id=title href=/ rel=home>Site</a>`
  + `<nav><ul><li><a href=/blog>Blog</a></ul></nav></header>`
  + `<main itemscope><h1>Post</h1>`
  + `<nav aria-label=Breadcrumbs><a href=/>Home</a></nav>`
  + `<nav aria-label=Contents><ol class="toc-level"><li><a class=toc-link href=#x>X</a></ol></nav>`
  + `<section id=content>${content}</section></main>`

test("feed: the entry is the post body, not the document", () => {
  const html = entryContent(page("<p>Hello.</p>"), "https://site.test")

  assert.equal(html, "<p>Hello.</p>")
  for (const furniture of ["doctype", "<head", "<title", "stylesheet", "Breadcrumbs", "toc-link", "<header"]) {
    assert.ok(!html.includes(furniture), `feed content must not contain ${furniture}`)
  }
})

test("feed: the <section> wrapper itself is not included", () => {
  // The wrapper is vowel's page structure, not part of the post.
  const html = entryContent(page("<p>a</p><p>b</p>"), "https://site.test")
  assert.equal(html, "<p>a</p><p>b</p>")
})

test("feed: root-relative links and images become absolute", () => {
  const html = entryContent(
    page(`<p><a href=/blog/post>read</a><img src=/pic.jpg></p>`),
    "https://site.test"
  )
  assert.ok(html.includes('href="https://site.test/blog/post"'))
  assert.ok(html.includes('src="https://site.test/pic.jpg"'))
})

test("feed: every candidate in a srcset becomes absolute, descriptors intact", () => {
  const html = entryContent(
    page(`<img srcset="/pic-414.jpg 414w, /pic-768.jpg 768w">`),
    "https://site.test"
  )
  assert.ok(html.includes("https://site.test/pic-414.jpg 414w"))
  assert.ok(html.includes("https://site.test/pic-768.jpg 768w"))
  assert.ok(!html.includes('"/pic-'), "no candidate should stay relative")
})

test("feed: external and anchor links are left alone", () => {
  const html = entryContent(
    page(`<p><a href=https://elsewhere.test/x>out</a><a href=#section>down</a></p>`),
    "https://site.test"
  )
  assert.ok(html.includes('href="https://elsewhere.test/x"'))
  // An anchor should still point within the entry, not back to the site.
  assert.ok(html.includes('href="#section"'))
})

test("feed: a page with no content section yields an empty string, not a throw", () => {
  assert.equal(entryContent("<html><body><p>no section</p></body></html>", "https://site.test"), "")
})

test("feed: a target with no data yields an empty string", () => {
  // Until a page has been through the write pass its data is null.
  assert.equal(entryContent(null, "https://site.test"), "")
  assert.equal(entryContent(undefined, "https://site.test"), "")
  assert.equal(entryContent("", "https://site.test"), "")
})
