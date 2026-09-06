import test from "node:test"
import assert from "node:assert/strict"
import metadata, {
  parseTitle,
  parseMetaDescription,
  parseMetaKeywords,
  parseMetaAuthor,
  parseFavicon,
  parseOpenGraphTags,
  parseTwitterCardTags,
  parseCanonicalLink,
  parseOEmbedLink,
  parseSchemaOrg
} from "../plugins/urls/urlMetadata.js"

const html = `
  <html><head>
    <title>Hello &amp; World</title>
    <meta name="description" content="A page about greetings" />
    <meta name="keywords" content="hello, world , greetings" />
    <meta name="author" content="Ada Lovelace" />
    <link rel="shortcut icon" href="https://example.com/favicon.ico" />
    <meta property="og:title" content="Hello &amp; World" />
    <meta property='og:image' content='https://example.com/a.png'>
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="https://example.com/page" />
    <link rel="stylesheet" href="https://example.com/ignored.css" />
    <link type="application/json+oembed" href="https://example.com/oembed.json" />
    <script type="application/ld+json">{"@type": "Article", "headline": "Hello"}</script>
    <script type="application/ld+json">not valid json</script>
  </head></html>
`

test("urlMetadata: parseTitle", () => {
  assert.equal(parseTitle(html), "Hello & World")
})

test("urlMetadata: parseTitle returns undefined when absent", () => {
  assert.equal(parseTitle("<html></html>"), undefined)
})

test("urlMetadata: parseMetaDescription", () => {
  assert.equal(parseMetaDescription(html), "A page about greetings")
})

test("urlMetadata: parseMetaKeywords splits and trims", () => {
  assert.deepEqual(parseMetaKeywords(html), ["hello", "world", "greetings"])
})

test("urlMetadata: parseMetaKeywords returns undefined when absent", () => {
  assert.equal(parseMetaKeywords("<html></html>"), undefined)
})

test("urlMetadata: parseMetaAuthor", () => {
  assert.equal(parseMetaAuthor(html), "Ada Lovelace")
})

test("urlMetadata: parseFavicon matches rel variants containing 'icon'", () => {
  assert.equal(parseFavicon(html), "https://example.com/favicon.ico")
})

test("urlMetadata: parseOpenGraphTags", () => {
  assert.deepEqual(parseOpenGraphTags(html), {
    title: "Hello & World",
    image: "https://example.com/a.png"
  })
})

test("urlMetadata: parseTwitterCardTags ignores non-twitter meta tags", () => {
  assert.deepEqual(parseTwitterCardTags(html), { card: "summary_large_image" })
})

test("urlMetadata: parseCanonicalLink ignores non-canonical link tags", () => {
  assert.equal(parseCanonicalLink(html), "https://example.com/page")
})

test("urlMetadata: parseCanonicalLink returns undefined when absent", () => {
  assert.equal(parseCanonicalLink("<html></html>"), undefined)
})

test("urlMetadata: parseOEmbedLink finds the discovery URL", () => {
  assert.equal(parseOEmbedLink(html), "https://example.com/oembed.json")
})

test("urlMetadata: parseSchemaOrg parses valid blocks and skips invalid ones", () => {
  assert.deepEqual(parseSchemaOrg(html), [{ "@type": "Article", headline: "Hello" }])
})

test("urlMetadata: parseSchemaOrg returns an empty array when absent", () => {
  assert.deepEqual(parseSchemaOrg("<html></html>"), [])
})

test("urlMetadata: metadata() combines every parser", () => {
  assert.deepEqual(metadata(html), {
    title: "Hello & World",
    description: "A page about greetings",
    keywords: ["hello", "world", "greetings"],
    author: "Ada Lovelace",
    favicon: "https://example.com/favicon.ico",
    openGraph: { title: "Hello & World", image: "https://example.com/a.png" },
    twitterCard: { card: "summary_large_image" },
    canonical: "https://example.com/page",
    oembedURL: "https://example.com/oembed.json",
    schemaOrg: [{ "@type": "Article", headline: "Hello" }]
  })
})
