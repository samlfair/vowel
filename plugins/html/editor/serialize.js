// Svedit document -> markdown.
//
// The document was built from HTML (see ingest.js), so this is the only
// place markdown is produced. mdast-util-to-markdown does the escaping,
// which is the reason not to hand-roll it: a paragraph containing a
// literal "*" has to come back out as "\*".

import { toMarkdown } from "mdast-util-to-markdown"
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough"
import { highlightMarkToMarkdown } from "mdast-util-highlight-mark"

const MARK_BUILDERS = {
  strong: (children) => ({ type: "strong", children }),
  emphasis: (children) => ({ type: "emphasis", children }),
  highlight: (children) => ({ type: "highlight", children }),
  strikethrough: (children) => ({ type: "delete", children }),
  link: (children, node) => ({ type: "link", url: node.href || "", children }),
  inline_code: (children) => ({ type: "inlineCode", value: plainText(children) })
}

/** @param {object[]} children */
function plainText(children) {
  return children.map(child => child.value ?? plainText(child.children || [])).join("")
}

/**
 * Offset ranges back to nested inline mdast. Marks are mutually exclusive
 * and non-overlapping, so a single ordered pass over the string is enough.
 *
 * @param {{content: string, marks: object[]}} value
 * @param {Record<string, object>} nodes
 */
function inlineFrom(value, nodes) {
  const content = value.content || ""
  const marks = [...(value.marks || [])].sort((left, right) => {
    return left.start_offset - right.start_offset
  })

  const { children, cursor } = marks.reduce((accumulated, mark) => {
    const markNode = nodes[mark.node_id]
    const builder = markNode && MARK_BUILDERS[markNode.type]
    if (!builder) return accumulated

    const before = content.slice(accumulated.cursor, mark.start_offset)
    const inner = content.slice(mark.start_offset, mark.end_offset)
    const leading = before ? [{ type: "text", value: before }] : []

    return {
      cursor: mark.end_offset,
      children: [
        ...accumulated.children,
        ...leading,
        builder([{ type: "text", value: inner }], markNode)
      ]
    }
  }, { children: [], cursor: 0 })

  const trailing = content.slice(cursor)
  return trailing ? [...children, { type: "text", value: trailing }] : children
}

/**
 * @param {string} id
 * @param {Record<string, object>} nodes
 */
function blockFrom(id, nodes) {
  const node = nodes[id]
  if (!node) return null

  if (node.type === "paragraph") {
    return { type: "paragraph", children: inlineFrom(node.content, nodes) }
  }

  if (node.type === "heading") {
    return { type: "heading", depth: node.level || 2, children: inlineFrom(node.content, nodes) }
  }

  if (node.type === "list") {
    const children = node.items.nodes.map(itemId => ({
      type: "listItem",
      spread: false,
      children: [{ type: "paragraph", children: inlineFrom(nodes[itemId].content, nodes) }]
    }))
    return { type: "list", ordered: Boolean(node.ordered), spread: false, children }
  }

  if (node.type === "blockquote") {
    return { type: "blockquote", children: node.body.nodes.map(child => blockFrom(child, nodes)) }
  }

  if (node.type === "alert") {
    // The marker line the html plugin consumed is regenerated here. It is
    // emitted raw rather than as text: escaping would make it "\[!NOTE]",
    // which survives vowel's own parser but is not the literal GFM syntax.
    const marker = {
      type: "html",
      value: `[!${(node.variant || "note").toUpperCase()}]`
    }
    const body = node.body.nodes.map(child => blockFrom(child, nodes))
    return { type: "blockquote", children: [marker, ...body] }
  }

  if (node.type === "code_block") {
    return { type: "code", lang: node.language || null, value: node.code || "" }
  }

  if (node.type === "thematic_break") {
    return { type: "thematicBreak" }
  }

  if (node.type === "image") {
    const image = { type: "image", url: node.source, alt: node.alt || "" }
    const caption = node.caption ? [{ type: "text", value: ` ${node.caption}` }] : []
    return { type: "paragraph", children: [image, ...caption] }
  }

  if (node.type === "embed") {
    // The directive was reconstructed from the expansion's own class
    // attributes at ingest; emitted verbatim so it never expands twice.
    return { type: "html", value: node.directive }
  }

  return null
}

/**
 * @param {{document_id: string, nodes: Record<string, object>}} doc
 * @returns {string}
 */
export default function serialize(doc) {
  const page = doc.nodes[doc.document_id]
  const children = page.body.nodes
    .map(id => blockFrom(id, doc.nodes))
    .filter(Boolean)

  return toMarkdown({ type: "root", children }, {
    extensions: [gfmStrikethroughToMarkdown(), highlightMarkToMarkdown],
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fences: true,
    rule: "-"
  })
}
