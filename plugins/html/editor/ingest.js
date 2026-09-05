// HTML -> Svedit document.
//
// #content is the source of truth: this walks the rendered DOM and builds
// the Svedit node graph from it. Nothing here parses markdown.
//
// The tag table is a closed allowlist. An element it does not recognise
// fails the whole ingest rather than being guessed at, because a wrong
// guess round-trips to markdown that silently replaces the author's
// content on save.

import { globParams, globDirective } from "./directives.js"

const TEXT_NODE = 3
const ELEMENT_NODE = 1

// Inline elements that become marks. Marks are ranges over a plain string,
// so everything below collapses to offsets during the inline walk.
const MARK_TYPES = {
  STRONG: "strong",
  B: "strong",
  EM: "emphasis",
  I: "emphasis",
  CODE: "inline_code",
  MARK: "highlight",
  DEL: "strikethrough",
  S: "strikethrough",
  A: "link"
}

const HEADING_LEVELS = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6
}

/** @param {Element} element */
function classList(element) {
  return [...element.classList]
}

/**
 * A block whose subtree was expanded from a compact directive. Its
 * parameters live in the class attribute (see directives.js); its
 * children are generated and must not be edited as prose.
 * @param {Element} element
 */
function expansionDirective(element) {
  const classes = classList(element)

  if (element.tagName === "UL" && classes.some(name => name.startsWith("_"))) {
    const params = globParams(classes)
    return params && globDirective(params)
  }

  if (element.tagName === "ARTICLE" && classes.includes("reference")) {
    const link = element.querySelector("a[href]")
    return link && link.getAttribute("href")
  }

  // Two transforms produce a bare-URL card: the rich a.link-preview built
  // from url metadata, and the plainer <article> fallback.
  if (element.tagName === "A" && classes.includes("link-preview")) {
    return element.getAttribute("href")
  }

  if (element.tagName === "ARTICLE" && classes.includes("link-preview")) {
    const link = element.querySelector("a[href]")
    return link && link.getAttribute("href")
  }

  return null
}

/**
 * Flattens inline DOM into Svedit's { content, marks } shape.
 *
 * Marks are mutually exclusive within a property, so nested inline
 * formatting cannot be represented faithfully. Outermost wins: once inside
 * a mark, descendants contribute their text but no further marks.
 *
 * @param {Node} domNode
 * @param {{createMark: (type: string, element: Element) => string}} context
 * @param {boolean} insideMark
 */
function inlineFrom(domNode, context, insideMark) {
  if (domNode.nodeType === TEXT_NODE) {
    return { content: domNode.nodeValue, marks: [] }
  }

  if (domNode.nodeType !== ELEMENT_NODE) {
    return { content: "", marks: [] }
  }

  if (domNode.tagName === "BR") {
    return { content: "\n", marks: [] }
  }

  const markType = insideMark ? null : MARK_TYPES[domNode.tagName]
  const children = [...domNode.childNodes].map(child => {
    return inlineFrom(child, context, insideMark || Boolean(markType))
  })

  const combined = children.reduce((accumulated, result) => {
    const shifted = result.marks.map(mark => ({
      ...mark,
      start_offset: mark.start_offset + accumulated.content.length,
      end_offset: mark.end_offset + accumulated.content.length
    }))
    return {
      content: accumulated.content + result.content,
      marks: [...accumulated.marks, ...shifted]
    }
  }, { content: "", marks: [] })

  if (!markType) return combined

  const markId = context.createMark(markType, domNode)
  return {
    content: combined.content,
    marks: [{ start_offset: 0, end_offset: combined.content.length, node_id: markId }]
  }
}

/**
 * Whitespace at a block's edges is layout, not content: the hast
 * conversion leaves a trailing newline inside <li> and <p>, which would
 * serialize back as a blank line and grow the file on every save. Marks
 * are clamped into the trimmed range and dropped if they collapse.
 * @param {{content: string, marks: object[]}} value
 */
function trimValue({ content, marks }) {
  const leading = content.length - content.trimStart().length
  const trimmed = content.trim()

  const clamped = marks
    .map(mark => ({
      ...mark,
      start_offset: Math.max(0, Math.min(mark.start_offset - leading, trimmed.length)),
      end_offset: Math.max(0, Math.min(mark.end_offset - leading, trimmed.length))
    }))
    .filter(mark => mark.end_offset > mark.start_offset)

  return { content: trimmed, marks: clamped, annotations: [] }
}

/** @param {Element} element */
function textValue(element, context) {
  return trimValue(inlineFrom(element, context, false))
}

/** @param {Element} element */
function pictureIn(element) {
  if (element.tagName === "PICTURE") return element
  return element.querySelector("picture")
}

/**
 * @param {Element} element
 * @param {object} context
 * @returns {string|null} the created node's id, or null if unrecognised
 */
function blockFrom(element, context) {
  const directive = expansionDirective(element)
  if (directive) {
    return context.create({
      type: "embed",
      directive,
      html: element.outerHTML
    })
  }

  const tag = element.tagName

  if (tag === "P") {
    // The image transform replaces an <img> in place, so a paragraph whose
    // only element is a <picture> is an image block, not prose.
    const picture = pictureIn(element)
    if (picture && !element.textContent.trim()) return imageFrom(picture, null, element, context)

    return context.create({
      type: "paragraph",
      content: textValue(element, context)
    })
  }

  if (HEADING_LEVELS[tag]) {
    return context.create({
      type: "heading",
      level: HEADING_LEVELS[tag],
      content: textValue(element, context)
    })
  }

  if (tag === "UL" || tag === "OL") {
    const items = [...element.children].map(child => {
      if (child.tagName !== "LI") return null
      return context.create({
        type: "list_item",
        content: textValue(child, context)
      })
    })

    if (items.some(id => !id)) return null

    return context.create({
      type: "list",
      ordered: tag === "OL",
      items: { nodes: items, marks: [], annotations: [] }
    })
  }

  if (tag === "ASIDE" && classList(element).includes("alert")) {
    // > [!NOTE] became <aside class="alert note">, with the marker line
    // replaced by an injected <h2>. The variant is the class; the injected
    // heading is dropped and regenerated on the way out.
    const variant = classList(element).find(name => name !== "alert")
    const body = [...element.children]
      .filter(child => child.tagName !== "H2")
      .map(child => blockFrom(child, context))

    if (body.some(id => !id)) return null

    return context.create({
      type: "alert",
      variant: variant || "note",
      body: { nodes: body, marks: [], annotations: [] }
    })
  }

  if (tag === "BLOCKQUOTE") {
    const body = [...element.children].map(child => blockFrom(child, context))
    if (body.some(id => !id)) return null

    return context.create({
      type: "blockquote",
      body: { nodes: body, marks: [], annotations: [] }
    })
  }

  if (tag === "PRE") {
    const code = element.querySelector("code")
    const language = code
      ? (classList(code).find(name => name.startsWith("language-")) || "").slice("language-".length)
      : ""

    // textContent strips the highlighter's span tree, which is presentation.
    // The fence supplies its own trailing newline on the way out.
    return context.create({
      type: "code_block",
      language,
      code: (code || element).textContent.replace(/\n+$/, "")
    })
  }

  if (tag === "HR") {
    return context.create({ type: "thematic_break" })
  }

  if (tag === "FIGURE") {
    const picture = pictureIn(element)
    const caption = element.querySelector("figcaption")
    if (picture) return imageFrom(picture, caption, element, context)
  }

  if (tag === "PICTURE") {
    return imageFrom(element, null, element, context)
  }

  context.unrecognised.push(tag.toLowerCase() + (element.className ? `.${element.className}` : ""))
  return null
}

/**
 * @param {Element} picture
 * @param {Element|null} caption
 * @param {Element} outer the element whose markup is kept for rendering
 */
function imageFrom(picture, caption, outer, context) {
  const img = picture.querySelector("img")
  const source = picture.getAttribute("data-original")

  if (!source) {
    context.unrecognised.push("picture (no data-original)")
    return null
  }

  return context.create({
    type: "image",
    source,
    alt: img ? (img.getAttribute("alt") || "") : "",
    caption: caption ? caption.textContent : "",
    html: outer.outerHTML
  })
}

/**
 * Builds a Svedit document from a rendered #content element.
 *
 * @param {Element} contentElement
 * @param {() => string} generateId
 * @returns {{doc: object|null, unrecognised: string[]}}
 */
export default function ingest(contentElement, generateId) {
  const nodes = {}
  const unrecognised = []

  const context = {
    unrecognised,
    create(node) {
      const id = generateId()
      nodes[id] = { ...node, id }
      return id
    },
    createMark(type, element) {
      const properties = type === "link"
        ? { href: element.getAttribute("href") || "" }
        : {}
      return context.create({ type, ...properties })
    }
  }

  const body = [...contentElement.children].map(child => blockFrom(child, context))

  if (unrecognised.length) return { doc: null, unrecognised }

  const pageId = generateId()
  nodes[pageId] = {
    id: pageId,
    type: "page",
    body: { nodes: body.filter(Boolean), marks: [], annotations: [] }
  }

  return { doc: { document_id: pageId, nodes }, unrecognised: [] }
}
