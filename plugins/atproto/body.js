import { toMarkdown } from "mdast-util-to-markdown"
import { gfmTableToMarkdown } from "mdast-util-gfm-table"
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough"
import { gfmFootnoteToMarkdown } from "mdast-util-gfm-footnote"
import { gfmTaskListItemToMarkdown } from "mdast-util-gfm-task-list-item"
import { toText } from "hast-util-to-text"
import { emojiFor } from "../markdown/emoji.js"
import { alertLabel } from "../html/editor/directives.js"

/**
 * A page's body as a record carries it, from the rendered
 * `<section id=content>`: after the html plugin has resolved images,
 * wikilinks and icons and expanded listings, which the source markdown
 * has not. Two forms:
 *
 * - **Simplified markdown** (`markdownBody`), for a body field with no
 *   facets: CommonMark, plus the GFM tables, strikethrough, task items
 *   and footnotes vowel itself reads. Links and images are absolute; an
 *   image links to its copy on the site. An icon is its emoji, or its
 *   shortcode as text. A listing is a list of links. A hashtag is a link
 *   whose text keeps its `#`. An alert is GFM's (`> [!NOTE]`). No
 *   title: it is outside the section.
 * - **Rich text** (`richTextBody`), for a `text` field with `facets`
 *   beside it: plain text, and a facet for each link, hashtag and mark
 *   the lexicon has a feature for. The rest is dropped, images included.
 */

/** @param {any} node @param {string} tag */
const is = (node, tag) => node?.type === "element" && node.tagName === tag

/** @param {any} node */
const classes = (node) => [node?.properties?.className ?? []].flat().map(String)

/** @param {any} node @param {string} name */
const hasClass = (node, name) => classes(node).includes(name)

/** @param {string} value @param {string} base */
function absolute(value, base) {
  try {
    return new URL(value, base).href
  } catch {
    return value
  }
}

/**
 * An icon as text: `img.icon[data-icon=fa/rocket]` → 🚀, found by the
 * name's last segment, else the shortcode the author wrote.
 * @param {any} node
 */
function iconText(node) {
  const name = String(node.properties?.dataIcon ?? node.properties?.alt ?? "")
  return emojiFor(name.split("/").at(-1)) ?? `:${name}:`
}

/**
 * A listing item is `li > a > article`, the article holding the
 * post's heading. Its title and url, or undefined.
 * @param {any} node - an `a`
 */
function listingLink(node) {
  const article = (node.children ?? []).find(child => is(child, "article"))
  if (!article) return undefined
  const heading = (article.children ?? []).find(child => ["h1", "h2", "h3", "h4", "h5", "h6"].includes(child?.tagName))
  const title = toText(heading ?? article).trim()
  return { title, href: node.properties?.href }
}

/** A footnote reference's label, from `#user-content-fn-<label>`. @param {any} node */
function footnoteLabel(node) {
  const href = String(node.properties?.href ?? "")
  return href.replace(/^#user-content-fn-/, "")
}

/** @param {any} node */
const isFootnoteReference = (node) => is(node, "a") && ("dataFootnoteRef" in (node.properties ?? {}))

/** @param {any} node */
const isFootnoteSection = (node) => is(node, "section") && ("dataFootnotes" in (node.properties ?? {}))

const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre", "hr", "table", "div", "section", "figure", "figcaption", "details", "summary", "aside", "article", "header", "footer", "main", "picture", "dl", "dd", "dt"])
const DROPPED = new Set(["script", "style", "template", "svg", "iframe", "video", "audio", "nav", "form", "button", "noscript", "source"])

/** @param {any} node */
const isBlock = (node) => node?.type === "element" && BLOCKS.has(node.tagName)

// ---------------------------------------------------------------------
// Simplified markdown: hast → mdast, then mdast-util-to-markdown, which
// does the escaping.

/**
 * @param {any[]} nodes
 * @param {string} base - the page's URL
 * @returns {any[]} mdast phrasing content
 */
function phrasing(nodes, base) {
  return nodes.flatMap(node => phrase(node, base))
}

/** @param {any} node @param {string} base @returns {any[]} */
function phrase(node, base) {
  if (node.type === "text") return [{ type: "text", value: node.value.replace(/\s+/g, " ") }]
  if (node.type !== "element" || DROPPED.has(node.tagName)) return []
  const tag = node.tagName
  const children = () => phrasing(node.children ?? [], base)
  if (tag === "strong" || tag === "b") return [{ type: "strong", children: children() }]
  if (tag === "em" || tag === "i") return [{ type: "emphasis", children: children() }]
  if (tag === "del" || tag === "s") return [{ type: "delete", children: children() }]
  if (tag === "code") return [{ type: "inlineCode", value: toText(node) }]
  if (tag === "br") return [{ type: "break" }]
  if (tag === "img") {
    if (hasClass(node, "icon")) return [{ type: "text", value: iconText(node) }]
    const src = node.properties?.src
    return src ? [{ type: "image", url: absolute(String(src), base), alt: String(node.properties?.alt ?? "") }] : []
  }
  if (tag === "picture") {
    const img = (node.children ?? []).find(child => is(child, "img"))
    // The <img>'s src is the largest derivative in the image's own
    // format; the original is not published (plugins/images).
    const src = img?.properties?.src
    return src ? [{ type: "image", url: absolute(String(src), base), alt: String(img?.properties?.alt ?? "") }] : []
  }
  if (tag === "a") {
    if (isFootnoteReference(node)) return [{ type: "footnoteReference", identifier: footnoteLabel(node), label: footnoteLabel(node) }]
    const listing = listingLink(node)
    if (listing) return [{ type: "link", url: absolute(String(listing.href), base), children: [{ type: "text", value: listing.title }] }]
    const href = node.properties?.href
    // An unresolved wikilink has no href: its text is all there is.
    if (href === undefined || href === null) return children()
    return [{ type: "link", url: absolute(String(href), base), children: children() }]
  }
  if (tag === "input") return []
  return children()
}

/**
 * @param {any[]} nodes
 * @param {string} base
 * @returns {any[]} mdast block content
 */
function blocks(nodes, base) {
  const { out, run } = nodes.reduce(({ out, run }, node) => {
    if (isBlock(node) || isFootnoteSection(node)) {
      const flushed = run.length ? [...out, paragraph(run, base)] : out
      return { out: [...flushed, ...block(node, base)], run: [] }
    }
    if (node.type === "text" && !node.value.trim() && !run.length) return { out, run }
    return { out, run: [...run, node] }
  }, { out: [], run: [] })
  const all = run.length ? [...out, paragraph(run, base)] : out
  return all.filter(Boolean)
}

/** @param {any[]} nodes @param {string} base */
function paragraph(nodes, base) {
  const children = trimPhrasing(phrasing(nodes, base))
  return children.length ? { type: "paragraph", children } : undefined
}

/**
 * Leading and trailing whitespace off a run of phrasing, adjacent text
 * merged first so a space before a dropped element is trimmed too.
 * @param {any[]} input
 */
function trimPhrasing(input) {
  const children = input.reduce((merged, child) => {
    const previous = merged.at(-1)
    if (child.type === "text" && previous?.type === "text") return [...merged.slice(0, -1), { ...previous, value: previous.value + child.value }]
    return [...merged, child]
  }, [])
  const first = children[0]
  const last = children.at(-1)
  const start = first?.type === "text" ? [{ ...first, value: first.value.replace(/^\s+/, "") }, ...children.slice(1)] : children
  const trimmed = last?.type === "text" && start.length ? [...start.slice(0, -1), { ...start.at(-1), value: start.at(-1).value.replace(/\s+$/, "") }] : start
  return trimmed.filter(child => child.type !== "text" || child.value)
}

/** @param {any} node @param {string} base @returns {any[]} */
function block(node, base) {
  const tag = node.tagName
  if (DROPPED.has(tag)) return []
  if (tag === "p" || tag === "figcaption" || tag === "summary" || tag === "dt") return [paragraph(node.children ?? [], base)]
  if (/^h[1-6]$/.test(tag)) return [{ type: "heading", depth: Number(tag[1]), children: trimPhrasing(phrasing(node.children ?? [], base)) }]
  if (tag === "hr") return [{ type: "thematicBreak" }]
  if (tag === "picture") return [paragraph([node], base)]
  if (tag === "aside" && hasClass(node, "alert")) return [alert(node, base)]
  if (tag === "blockquote") return [{ type: "blockquote", children: blocks(node.children ?? [], base) }]
  if (tag === "pre") {
    const code = (node.children ?? []).find(child => is(child, "code")) ?? node
    const language = classes(code).find(name => name.startsWith("language-"))?.slice("language-".length)
    return [{ type: "code", lang: language ?? null, value: toText(code).replace(/\n$/, "") }]
  }
  if (tag === "ul" || tag === "ol") return [list(node, base)]
  if (tag === "table") return [table(node, base)]
  if (isFootnoteSection(node)) return footnotes(node, base)
  return blocks(node.children ?? [], base)
}

/**
 * An alert, `<aside class="alert note">` with its heading first, back in
 * GFM's form: `> [!NOTE]`, then the text on the next line. A heading the
 * author wrote stays on the marker's line (`> [!NOTE] How to render`,
 * Obsidian's title, which vowel reads too); the default one, the type in
 * sentence case, is left off. The marker is raw `html` so that it is
 * not escaped as a link reference.
 * @param {any} node
 * @param {string} base
 */
function alert(node, base) {
  const type = classes(node).find(name => name !== "alert") ?? "note"
  const [first, ...rest] = (node.children ?? []).filter(child => child.type === "element")
  const hasHeading = /^h[1-6]$/.test(first?.tagName ?? "")
  const title = hasHeading && toText(first).trim() !== alertLabel(type) ? trimPhrasing(phrasing(first.children ?? [], base)) : []
  const marker = [{ type: "html", value: `[!${type.toUpperCase()}]` }, ...(title.length ? [{ type: "text", value: " " }, ...title] : [])]
  const body = blocks(hasHeading ? rest : [first, ...rest].filter(child => child), base)
  const [lead, ...after] = body
  const children = lead?.type === "paragraph"
    ? [{ ...lead, children: [...marker, { type: "text", value: "\n" }, ...lead.children] }, ...after]
    : [{ type: "paragraph", children: marker }, ...body]
  return { type: "blockquote", children }
}

/** @param {any} node @param {string} base */
function list(node, base) {
  const items = (node.children ?? []).filter(child => is(child, "li"))
  const start = Number(node.properties?.start ?? 1)
  return {
    type: "list",
    ordered: node.tagName === "ol",
    start,
    spread: false,
    children: items.map(item => {
      const checkbox = (item.children ?? []).find(child => is(child, "input") && child.properties?.type === "checkbox")
      return {
        type: "listItem",
        spread: false,
        checked: checkbox ? Boolean(checkbox.properties?.checked) : null,
        children: blocks(item.children ?? [], base)
      }
    })
  }
}

/** @param {any} node @param {string} base */
function table(node, base) {
  const rows = []
  const collect = (parent) => (parent.children ?? []).forEach(child => {
    if (is(child, "tr")) rows.push(child)
    else if (child.type === "element") collect(child)
  })
  collect(node)
  return {
    type: "table",
    align: [],
    children: rows.map(row => ({
      type: "tableRow",
      children: (row.children ?? []).filter(cell => is(cell, "td") || is(cell, "th")).map(cell => ({
        type: "tableCell",
        children: trimPhrasing(phrasing(cell.children ?? [], base))
      }))
    }))
  }
}

/** The footnotes section, as definitions; the back-links dropped. @param {any} node @param {string} base */
function footnotes(node, base) {
  const items = []
  const collect = (parent) => (parent.children ?? []).forEach(child => {
    if (is(child, "li")) items.push(child)
    else if (child.type === "element") collect(child)
  })
  collect(node)
  /** @param {any} parent @returns {any} */
  const withoutBacklinks = (parent) => ({
    ...parent,
    children: (parent.children ?? [])
      .filter(child => !(is(child, "a") && ("dataFootnoteBackref" in (child.properties ?? {}))))
      .map(child => child.type === "element" ? withoutBacklinks(child) : child)
  })
  return items.map(item => {
    const label = String(item.properties?.id ?? "").replace(/^user-content-fn-/, "")
    return { type: "footnoteDefinition", identifier: label, label, children: blocks(withoutBacklinks(item).children ?? [], base) }
  })
}

/**
 * The body as simplified markdown.
 * @param {any} section - the page's `<section id=content>` (entryContent.js)
 * @param {string} pageURL - absolute; relative links resolve against it
 * @returns {string}
 */
function markdownBody(section, pageURL) {
  if (!section) return ""
  const tree = { type: "root", children: blocks(section.children ?? [], pageURL) }
  return toMarkdown(tree, {
    extensions: [gfmTableToMarkdown(), gfmStrikethroughToMarkdown(), gfmFootnoteToMarkdown(), gfmTaskListItemToMarkdown()],
    bullet: "-",
    emphasis: "*",
    rule: "-",
    fences: true
  }).trim()
}

// ---------------------------------------------------------------------
// Rich text: plain text and facets.

/**
 * The marks rich text can carry, by feature name. A lexicon's facet
 * features are matched by the name after `#` (`app.bsky.richtext.facet#link`),
 * so any facet lexicon shaped like Bluesky's works, and a feature the
 * lexicon doesn't define is simply not emitted.
 * @typedef {{ $type: string, uriProperty?: string, tagProperty?: string }} Feature
 * @typedef {Partial<Record<"link" | "tag" | "bold" | "italic" | "code" | "strikethrough", Feature>>} Features
 */

const MARKS = { strong: "bold", b: "bold", em: "italic", i: "italic", code: "code", del: "strikethrough", s: "strikethrough" }

/**
 * @param {any} section
 * @param {string} pageURL
 * @param {Features} features
 * @returns {{ text: string, spans: { start: number, end: number, feature: object }[] }}
 *   `start`/`end` are string indices; `facetsFor` turns them into bytes
 *   once the text is final.
 */
function richTextBody(section, pageURL, features) {
  const state = { text: "", spans: [] }

  /** Separate what comes next from what came before. @param {string} separator */
  const separate = (separator) => {
    if (!state.text) return
    const trimmed = state.text.replace(/[ \t]+$/, "")
    state.text = trimmed.endsWith(separator) || (separator === "\n" && trimmed.endsWith("\n")) ? trimmed : trimmed.replace(/\n*$/, "") + separator
  }

  /** @param {string} value */
  const append = (value) => {
    const atLineStart = !state.text || state.text.endsWith("\n")
    state.text += atLineStart ? value.replace(/^\s+/, "") : value
  }

  /** @param {number} start @param {object} feature */
  const span = (start, feature) => {
    if (state.text.length > start && feature) state.spans.push({ start, end: state.text.length, feature })
  }

  /** @param {any} node @param {boolean} [pre] */
  const inline = (node, pre = false) => {
    if (node.type === "text") return append(pre ? node.value : node.value.replace(/\s+/g, " "))
    if (node.type !== "element" || DROPPED.has(node.tagName)) return
    const tag = node.tagName
    if (tag === "br") return append("\n")
    if (tag === "img") return hasClass(node, "icon") ? append(iconText(node)) : undefined
    if (tag === "picture" || tag === "input" || isFootnoteReference(node)) return
    if (tag === "a") {
      const listing = listingLink(node)
      const start = state.text.length
      if (listing) append(listing.title)
      else (node.children ?? []).forEach(child => inline(child))
      const href = listing?.href ?? node.properties?.href
      if (href === undefined || href === null) return
      if (hasClass(node, "hashtag") && features.tag) {
        const tag = state.text.slice(start).replace(/^#/, "")
        return span(start, { $type: features.tag.$type, [features.tag.tagProperty ?? "tag"]: tag })
      }
      if (features.link) span(start, { $type: features.link.$type, [features.link.uriProperty ?? "uri"]: absolute(String(href), pageURL) })
      return
    }
    const mark = MARKS[tag]
    const start = state.text.length
    ;(node.children ?? []).forEach(child => inline(child, pre))
    if (mark && features[mark]) span(start, { $type: features[mark].$type })
  }

  /** @param {any} node @param {number} depth */
  const blockNode = (node, depth) => {
    if (node.type === "text") return node.value.trim() ? inline(node) : undefined
    if (node.type !== "element" || DROPPED.has(node.tagName) || isFootnoteSection(node)) return
    const tag = node.tagName
    if (!isBlock(node)) return inline(node)
    if (tag === "hr" || tag === "picture") return separate("\n\n")
    if (tag === "ul" || tag === "ol") {
      const items = (node.children ?? []).filter(child => is(child, "li"))
      if (depth === 0) separate("\n\n")
      items.forEach((item, index) => {
        separate("\n")
        // Not append(): that strips the indentation at a line's start.
        state.text += `${"  ".repeat(depth)}${tag === "ol" ? `${Number(node.properties?.start ?? 1) + index}.` : "-"} `
        ;(item.children ?? []).forEach(child => is(child, "ul") || is(child, "ol") ? blockNode(child, depth + 1) : isBlock(child) ? (child.children ?? []).forEach(inner => inline(inner)) : inline(child))
      })
      return separate("\n\n")
    }
    if (tag === "pre") {
      separate("\n\n")
      ;(node.children ?? []).forEach(child => inline(child, true))
      state.text = state.text.replace(/\n+$/, "")
      return separate("\n\n")
    }
    if (tag === "table") {
      const rows = []
      const collect = (parent) => (parent.children ?? []).forEach(child => is(child, "tr") ? rows.push(child) : child.type === "element" && collect(child))
      collect(node)
      separate("\n\n")
      rows.forEach(row => {
        separate("\n")
        const cells = (row.children ?? []).filter(cell => is(cell, "td") || is(cell, "th"))
        cells.forEach((cell, index) => {
          if (index) state.text = state.text.replace(/\s+$/, "") + " | "
          ;(cell.children ?? []).forEach(child => inline(child))
        })
      })
      return separate("\n\n")
    }
    if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "figcaption", "summary", "dt"].includes(tag)) {
      separate("\n\n")
      ;(node.children ?? []).forEach(child => inline(child))
      return separate("\n\n")
    }
    ;(node.children ?? []).forEach(child => blockNode(child, depth))
  }

  ;(section?.children ?? []).forEach(child => blockNode(child, 0))
  const text = state.text.replace(/\s+$/, "")
  return { text, spans: state.spans.filter(span => span.start < text.length) }
}

/**
 * Spans as facets over the final text, in UTF-8 bytes. A span the text
 * was trimmed through is dropped rather than cut, so no facet points
 * past the end.
 * @param {string} text
 * @param {{ start: number, end: number, feature: object }[]} spans
 * @param {{ startProperty: string, endProperty: string }} index - the facet's byte-slice property names
 */
function facetsFor(text, spans, index) {
  const bytes = (end) => Buffer.byteLength(text.slice(0, end))
  return spans
    .filter(span => span.end <= text.length && span.end > span.start)
    .map(span => ({ index: { [index.startProperty]: bytes(span.start), [index.endProperty]: bytes(span.end) }, features: [span.feature] }))
}

export { markdownBody, richTextBody, facetsFor }
