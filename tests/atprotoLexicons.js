import test from "node:test"
import assert from "node:assert/strict"
import { authorityName, validNSID } from "../plugins/atproto/lexicons.js"
import { fixtureResolver } from "./fixtures/lexicons.js"
import { mapRecord, trimWords } from "../plugins/atproto/mapper.js"
import { markdownBody, richTextBody } from "../plugins/atproto/body.js"
import { contentSection } from "../plugins/xml/entryContent.js"

const CONTEXT = { origin: "https://example.com", pageURL: "https://example.com/blog/post", path: "/blog/post", contentLexicon: "com.example.markdown" }

/** A page as publish.js hands it to the mapper. */
function page(overrides = {}) {
  return {
    title: "A post",
    description: "About it",
    date: "2026-03-04T00:00:00.000Z",
    tags: ["design"],
    frontmatter: {},
    markdown: () => "Some **markdown**.",
    richText: (features) => ({
      text: "Bold link #design",
      spans: [
        ...(features.bold ? [{ start: 0, end: 4, feature: { $type: features.bold.$type } }] : []),
        ...(features.link ? [{ start: 5, end: 9, feature: { $type: features.link.$type, uri: "https://x.test/" } }] : []),
        ...(features.tag ? [{ start: 10, end: 17, feature: { $type: features.tag.$type, tag: "design" } }] : [])
      ]
    }),
    ...overrides
  }
}

async function map(nsid, pageValue = page(), context = CONTEXT) {
  const { resolver } = fixtureResolver()
  const { lexicons } = await resolver.load([nsid, context.contentLexicon])
  return mapRecord(nsid, pageValue, { lexicons, context })
}

test("validNSID and authorityName: the DNS name an NSID's authority is published under", () => {
  assert.equal(validNSID("app.bsky.feed.post"), true)
  assert.equal(validNSID("site.standard.document"), true)
  assert.equal(validNSID("post"), false)
  assert.equal(validNSID("app.bsky"), false)
  assert.equal(validNSID("app.bsky.feed.post#main"), false)
  assert.equal(authorityName("app.bsky.feed.post"), "_lexicon.feed.bsky.app")
  assert.equal(authorityName("community.lexicon.calendar.event"), "_lexicon.calendar.lexicon.community")
})

test("the resolver follows a lexicon's refs to other lexicons, fetches each once, and reports one that isn't published", async () => {
  const { resolver, seen } = fixtureResolver()
  const { lexicons, errors } = await resolver.load(["com.example.note"])
  assert.ok(lexicons.get("com.example.note"))
  assert.ok(lexicons.get("com.example.facet"), "the facet lexicon the note refers to")
  await resolver.load(["com.example.note"])
  assert.deepEqual(seen.sort(), ["com.example.facet", "com.example.note"], "cached: fetched once each")

  const missing = await resolver.load(["com.unpublished.example.thing", "com.example.nothing"])
  assert.match(missing.errors.get("com.unpublished.example.thing"), /not published \(no DNS record at _lexicon\.example\.unpublished\.com\)/)
  assert.match(missing.errors.get("com.example.nothing"), /not published/)
  assert.equal(errors.size, 0)
})

test("aliases: title, name and description; the date to publishedAt, else createdAt; image only to `image`", async () => {
  const article = await map("com.example.article", page({ image: "/photo.jpg" }))
  assert.equal(article.record.title, "A post")
  assert.equal(article.record.description, "About it")
  assert.equal(article.record.publishedAt, "2026-03-04T00:00:00.000Z")
  assert.equal(article.record.createdAt, undefined, "publishedAt takes the date; createdAt doesn't also get it")
  assert.equal(article.record.image, "https://example.com/photo.jpg", "a path becomes a URL against the domain")
  assert.equal(article.record.cover, undefined, "never a second image field")

  const event = await map("com.example.event")
  assert.equal(event.record.name, "A post", "name is an alias for the title")
  assert.equal(event.record.createdAt, "2026-03-04T00:00:00.000Z")
})

test("the body goes to content before text, and never to textContent; an open union gets the content lexicon", async () => {
  const article = await map("com.example.article")
  assert.deepEqual(article.record.content, { $type: "com.example.markdown", body: { markdown: "Some **markdown**." } })
  assert.equal(article.record.text, undefined)
  assert.equal(article.record.textContent, undefined)
})

test("text with facets beside it is rich text, with a facet only for the features the lexicon defines", async () => {
  const note = await map("com.example.note")
  assert.equal(note.record.text, "Bold link #design")
  assert.deepEqual(note.record.facets.map(facet => facet.features[0].$type), ["com.example.facet#bold", "com.example.facet#link", "com.example.facet#tag"])
  assert.deepEqual(note.record.facets[1].index, { byteStart: 5, byteEnd: 9 })
})

test("frontmatter fills properties by name: snake_case finds camelCase, the camelCase key wins, nested YAML is nested objects", async () => {
  const event = await map("com.example.event", page({ frontmatter: {
    starts_at: "2026-10-14T19:00-04:00",
    mode: "com.example.event#inperson",
    locations: [{ country: "CA", postal_code: "M5S 2L5" }, { $type: "com.example.event#uri", uri: "https://maps.test/x" }],
    theme: { r: 12 },
    attendees: "40"
  } }))
  assert.ok(!("ignored" in event), JSON.stringify(event))
  assert.equal(event.record.startsAt, "2026-10-14T19:00:00-04:00", "the author's time, offset kept, seconds added")
  assert.equal(event.record.mode, "com.example.event#inperson")
  assert.deepEqual(event.record.theme, { $type: "com.example.event#colour", r: 12 }, "a union with one member gets its $type")
  assert.equal(event.record.attendees, 40)
  assert.deepEqual(event.record.locations, [{ $type: "com.example.event#uri", uri: "https://maps.test/x" }], "an item without its $type is dropped")
  assert.ok(event.warnings.some(warning => /locations: an item needs a \$type/.test(warning)), event.warnings.join("\n"))

  const both = await map("com.example.event", page({ frontmatter: { starts_at: "2026-01-01T00:00:00Z", startsAt: "2026-02-02T00:00:00Z" } }))
  assert.equal(both.record.startsAt, "2026-02-02T00:00:00Z")
})

test("a required property with no value, or a wrong one, means no record, and the reason names the lexicon and the property", async () => {
  const undated = await map("com.example.article", page({ date: undefined }))
  assert.equal(undated.ignored, "a com.example.article record needs publishedAt")

  const upload = await map("com.example.upload", page({ frontmatter: { file: "/photo.jpg" } }))
  assert.match(upload.ignored, /com\.example\.upload record file is a file upload/)

  const optional = await map("com.example.event", page({ frontmatter: { attendees: "lots" } }))
  assert.equal(optional.record.attendees, undefined, "an optional property that fails is left out")
  assert.ok(optional.warnings.some(warning => /attendees needs a whole number/.test(warning)))
})

test("text is trimmed at a word boundary and lists are cut to their length; a facet the trim cuts through is dropped", async () => {
  assert.equal(trimWords("one two three four", 9), "one two")
  assert.equal(trimWords("unbreakable", 4), "unbr")
  assert.equal(trimWords("é é é", undefined, 4), "é", "bytes count too")

  const long = await map("com.example.article", page({ title: "A title that is far too long for twenty" }))
  assert.equal(long.record.title, "A title that is far")

  const note = await map("com.example.note", page({
    tags: ["a", "b", "c"],
    richText: () => ({ text: "word ".repeat(10) + "linked", spans: [{ start: 0, end: 4, feature: {} }, { start: 50, end: 56, feature: {} }] })
  }))
  assert.equal(note.record.text, "word word word word word word")
  assert.equal(note.record.facets.length, 1)
  assert.deepEqual(note.record.tags, ["a", "b"])
})

test("record keys other than tid and any are not published to", async () => {
  const profile = await map("com.example.profile")
  assert.match(profile.ignored, /record key is "literal:self"/)
})

test("a site.standard record gets site and path as standard.site defines them", async () => {
  const withPublication = await map("site.standard.page", page(), { ...CONTEXT, publication: "at://did:plc:me/site.standard.publication/abc" })
  assert.equal(withPublication.record.site, "at://did:plc:me/site.standard.publication/abc")
  assert.equal(withPublication.record.path, "/blog/post")
  const other = await map("com.example.article")
  assert.equal(other.record.site, undefined)
})

const RENDERED = `<!doctype html><html><body><main><h1>The Title</h1><section id=content>
<p>A <strong>bold</strong> and <a href=/blog/other>a link</a> and <a href=/tags/design class=hashtag>#design</a> and <a class=wikilink data-note=Nowhere>Nowhere</a> <img class=icon data-icon=icons/rocket alt=rocket src=/icons/rocket.svg> <img class=icon data-icon=brand/vowel alt=vowel src=/brand/vowel.svg> café <a href=#part>jump</a>.
<p><picture><source srcset="/pic-1920.avif 1920w"><img src=/pic-1920.png alt="alt text"></picture>
<h2 id=part>Part</h2>
<ul><li>one<li>two<ul><li>nested</ul></ul>
<ul class="_ _blog"><li><a href=/blog/post><article><h1>First post</h1><time>March 4</time><p>Desc</article></a></ul>
<p>Last.<sup><a href=#user-content-fn-1 data-footnote-ref>1</a></sup>
<section data-footnotes class=footnotes><h2 class=sr-only>Footnotes</h2><ol><li id=user-content-fn-1><p>A note. <a href=#user-content-fnref-1 data-footnote-backref>↩</a></ol></section>
</section></main></body></html>`

test("simplified markdown: absolute links, the site's copy of an image, icons as emoji or text, listings as links, hashtags keep their #, no title", () => {
  const markdown = markdownBody(contentSection(RENDERED), "https://example.com/blog/post")
  assert.ok(!markdown.includes("The Title"), "the title is not in the body")
  assert.match(markdown, /\[a link\]\(https:\/\/example\.com\/blog\/other\)/)
  assert.match(markdown, /\[#design\]\(https:\/\/example\.com\/tags\/design\)/)
  assert.match(markdown, / Nowhere 🚀 :brand\/vowel: café /, "an unresolved wikilink is its text; an icon is its emoji, else its shortcode")
  assert.match(markdown, /\[jump\]\(https:\/\/example\.com\/blog\/post#part\)/)
  assert.match(markdown, /!\[alt text\]\(https:\/\/example\.com\/pic-1920\.png\)/)
  assert.match(markdown, /## Part/)
  assert.match(markdown, /- one\n- two\n {2}- nested/)
  // A second list straight after the first takes the other bullet, as CommonMark needs to tell them apart.
  assert.match(markdown, /[-*] \[First post\]\(https:\/\/example\.com\/blog\/post\)/)
  assert.match(markdown, /Last\.\[\^1\]\n\n\[\^1\]: A note\.$/)
})

test("rich text: plain text, and facets in UTF-8 bytes for the features asked for", () => {
  const features = { link: { $type: "x#link", uriProperty: "uri" }, tag: { $type: "x#tag", tagProperty: "tag" }, bold: { $type: "x#bold" } }
  const { text, spans } = richTextBody(contentSection(RENDERED), "https://example.com/blog/post", features)
  assert.ok(text.startsWith("A bold and a link and #design and Nowhere 🚀 :brand/vowel: café jump."), text)
  assert.match(text, /- one\n- two\n {2}- nested/)
  assert.match(text, /- First post/)
  assert.ok(!text.includes("↩") && !text.includes("Footnotes"))
  const link = spans.find(span => span.feature.uri === "https://example.com/blog/other")
  assert.equal(text.slice(link.start, link.end), "a link")
  const tag = spans.find(span => span.feature.$type === "x#tag")
  assert.deepEqual([text.slice(tag.start, tag.end), tag.feature.tag], ["#design", "design"])
  assert.ok(spans.some(span => span.feature.$type === "x#bold" && text.slice(span.start, span.end) === "bold"))
  assert.ok(!spans.some(span => span.feature.$type === "x#link" && span.feature.uri === undefined))

  const none = richTextBody(contentSection(RENDERED), "https://example.com/blog/post", {})
  assert.equal(none.spans.length, 0, "no feature, no facet")
})
