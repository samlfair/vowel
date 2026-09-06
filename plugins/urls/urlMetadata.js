const META_TAG_RE = /<meta\s+[^>]*>/gi
const LINK_TAG_RE = /<link\s+[^>]*>/gi
const ATTR_RE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
const TITLE_TAG_RE = /<title[^>]*>([\s\S]*?)<\/title>/i
const LD_JSON_RE = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

/**
 * Decodes the handful of HTML entities that show up in meta/link
 * attribute values often enough to matter for title/description text.
 * Not a full entity table - just the five predefined XML entities.
 * @param {string} value
 */
function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;/g, "'")
}

/**
 * Parses an HTML tag's attributes into a plain object, tolerant of
 * attribute order and single/double quoting.
 * @param {string} tag
 * @returns {Record<string, string>}
 */
function parseAttributes(tag) {
  const attrs = {}
  ATTR_RE.lastIndex = 0
  let match
  while ((match = ATTR_RE.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? ""
  }
  return attrs
}

/**
 * @param {string} html
 * @param {string} prefix
 * @returns {Record<string, string>}
 */
function parseMetaTagsByPrefix(html, prefix) {
  const result = {}
  const tags = html.match(META_TAG_RE) || []
  for (const tag of tags) {
    const attrs = parseAttributes(tag)
    const key = attrs.property || attrs.name
    if (!key || !key.startsWith(prefix) || attrs.content === undefined) continue
    result[key.slice(prefix.length)] = decodeEntities(attrs.content)
  }
  return result
}

/**
 * Extracts OpenGraph metadata (`<meta property="og:*">`) from an HTML
 * string. Keys have the `og:` prefix stripped, e.g. `{ title, description,
 * image, url, type, ... }`.
 * @param {string} html
 * @returns {Record<string, string>}
 */
function parseOpenGraphTags(html) {
  return parseMetaTagsByPrefix(html, "og:")
}

/**
 * Extracts Twitter Card metadata (`<meta name="twitter:*">`) from an
 * HTML string. Keys have the `twitter:` prefix stripped.
 * @param {string} html
 * @returns {Record<string, string>}
 */
function parseTwitterCardTags(html) {
  return parseMetaTagsByPrefix(html, "twitter:")
}

/**
 * Returns a page's canonical URL (`<link rel="canonical">`), if present.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseCanonicalLink(html) {
  const tags = html.match(LINK_TAG_RE) || []
  for (const tag of tags) {
    const attrs = parseAttributes(tag)
    if (attrs.rel?.toLowerCase() === "canonical" && attrs.href) return attrs.href
  }
  return undefined
}

/**
 * Returns a page's advertised oEmbed discovery URL
 * (`<link type="application/json+oembed">`), if present. Discovery only -
 * fetching this URL is the caller's responsibility, not this function's.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseOEmbedLink(html) {
  const tags = html.match(LINK_TAG_RE) || []
  for (const tag of tags) {
    const attrs = parseAttributes(tag)
    if (attrs.type === "application/json+oembed" && attrs.href) return attrs.href
  }
  return undefined
}

/**
 * Returns a page's `<title>` text, if present.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseTitle(html) {
  const match = html.match(TITLE_TAG_RE)
  return match ? decodeEntities(match[1].trim()) : undefined
}

/**
 * Returns a page's `<meta name="description">` content, if present.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseMetaDescription(html) {
  return parseNamedMetaTag(html, "description")
}

/**
 * Returns a page's `<meta name="keywords">` content as a list, split on
 * commas and trimmed. Undefined if the tag is absent.
 * @param {string} html
 * @returns {string[] | undefined}
 */
function parseMetaKeywords(html) {
  const content = parseNamedMetaTag(html, "keywords")
  if (content === undefined) return undefined
  return content.split(",").map(keyword => keyword.trim()).filter(Boolean)
}

/**
 * Returns a page's `<meta name="author">` content, if present.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseMetaAuthor(html) {
  return parseNamedMetaTag(html, "author")
}

/**
 * @param {string} html
 * @param {string} name
 * @returns {string | undefined}
 */
function parseNamedMetaTag(html, name) {
  const tags = html.match(META_TAG_RE) || []
  for (const tag of tags) {
    const attrs = parseAttributes(tag)
    if (attrs.name?.toLowerCase() === name && attrs.content !== undefined) {
      return decodeEntities(attrs.content)
    }
  }
  return undefined
}

/**
 * Returns a page's favicon URL, from any `<link rel="*icon*">` variant
 * (`icon`, `shortcut icon`, `apple-touch-icon`, ...). Returns the first
 * match found.
 * @param {string} html
 * @returns {string | undefined}
 */
function parseFavicon(html) {
  const tags = html.match(LINK_TAG_RE) || []
  for (const tag of tags) {
    const attrs = parseAttributes(tag)
    if (attrs.rel?.toLowerCase().includes("icon") && attrs.href) return attrs.href
  }
  return undefined
}

/**
 * Extracts schema.org structured data from `<script type="application/
 * ld+json">` blocks. A page can carry more than one, so this returns an
 * array - always, even for zero or one block found. Blocks that fail to
 * parse as JSON are skipped rather than thrown, since this is running
 * against untrusted external HTML.
 * @param {string} html
 * @returns {object[]}
 */
function parseSchemaOrg(html) {
  const results = []
  LD_JSON_RE.lastIndex = 0
  let match
  while ((match = LD_JSON_RE.exec(html))) {
    try {
      results.push(JSON.parse(match[1]))
    } catch (e) {
      continue
    }
  }
  return results
}

/**
 * Convenience wrapper combining all the parsers above into one call, for
 * a plugin's `read.url` handler to run against fetched HTML.
 * @param {string} html
 * @returns {{
 *   title: string | undefined,
 *   description: string | undefined,
 *   keywords: string[] | undefined,
 *   author: string | undefined,
 *   favicon: string | undefined,
 *   openGraph: Record<string, string>,
 *   twitterCard: Record<string, string>,
 *   canonical: string | undefined,
 *   oembedURL: string | undefined,
 *   schemaOrg: object[]
 * }}
 */
function metadata(html) {
  return {
    title: parseTitle(html),
    description: parseMetaDescription(html),
    keywords: parseMetaKeywords(html),
    author: parseMetaAuthor(html),
    favicon: parseFavicon(html),
    openGraph: parseOpenGraphTags(html),
    twitterCard: parseTwitterCardTags(html),
    canonical: parseCanonicalLink(html),
    oembedURL: parseOEmbedLink(html),
    schemaOrg: parseSchemaOrg(html)
  }
}

export {
  parseTitle,
  parseMetaDescription,
  parseMetaKeywords,
  parseMetaAuthor,
  parseFavicon,
  parseOpenGraphTags,
  parseTwitterCardTags,
  parseCanonicalLink,
  parseOEmbedLink,
  parseSchemaOrg,
  metadata
}
export default metadata
