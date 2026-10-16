// <main>'s children -> the page's frontmatter, and its natural metadata.
//
// The inverse of makeFrontmatter in plugins/html/index.js. A property
// from the frontmatter carries its key as a class (`fm_date`,
// `dl.fm_client`). The same properties written in the text - a date
// line, an image, a description ended with a rule - are direct children
// of <main> too, with their itemprop and no `fm_` class: those are
// rebuilt as markdown, to go back at the top of the body. The title is
// main's first <h1>: from the frontmatter when it has `fm_title`, else
// from a "#" heading, and written back the same way.

/** @param {Element} element */
function scalarFrom(element) {
  const text = element.textContent.trim()

  if (text === "true") return true
  if (text === "false") return false
  if (text === "null") return null

  // Number() accepts "" and whitespace, so the emptiness check has to come
  // first or a blank value becomes 0.
  if (text && !Number.isNaN(Number(text))) return Number(text)

  return text
}

/**
 * A date rendered as <time> carries an ISO datetime, but the author most
 * likely wrote a plain date. Midnight UTC comes back as a date only, so
 * "date: 2026-03-04" stays stable across saves.
 * @param {Element} element
 */
function dateFrom(element) {
  const datetime = element.getAttribute("datetime")
  if (!datetime) return element.textContent.trim()
  if (datetime.endsWith("T00:00:00.000Z")) return datetime.slice(0, "0000-00-00".length)
  return datetime
}

/** @param {Element} element the <dd> or <li> holding one value */
function valueFrom(element) {
  const list = element.querySelector(":scope > ul")
  if (list) return [...list.children].map(item => valueFrom(item))

  const nested = element.querySelector(":scope > dl")
  if (nested) return objectFrom(nested)

  const time = element.querySelector(":scope > time")
  if (time) return dateFrom(time)

  const link = element.querySelector(":scope > a[href]")
  if (link) return link.getAttribute("href")

  return scalarFrom(element)
}

/** @param {Element} list a <dl> of dt/dd pairs */
function objectFrom(list) {
  const terms = [...list.children]

  return terms.reduce((accumulated, node, index) => {
    if (node.tagName !== "DT") return accumulated

    const value = terms[index + 1]
    if (!value || value.tagName !== "DD") return accumulated

    return { ...accumulated, [node.textContent.trim()]: valueFrom(value) }
  }, {})
}

/**
 * One piece of natural metadata, back as the markdown that made it: the
 * date line as the author wrote it, the image, the description and the
 * rule that ended it. A description's inline marks are flattened to its
 * text, the editor's usual lossy rule.
 * @param {Element} element
 * @returns {string|null}
 */
function naturalLine(element) {
  const property = element.getAttribute("itemprop")
  if (property === "date") return element.textContent.trim()
  if (property === "description") return `${element.textContent.trim()}\n\n---`
  if (property !== "image") return null

  // A <picture>, or a plain <img> until the image has been read.
  const img = element.tagName === "IMG" ? element : element.querySelector("img")
  const source = element.getAttribute("data-original") ?? img?.getAttribute("src")
  return source ? `![${img?.getAttribute("alt") ?? ""}](${source})` : null
}

/**
 * @param {Element} main
 * @returns {{title: string|null, titleDeclared: boolean, properties: object, natural: string}}
 */
export default function readFrontmatter(main) {
  const children = [...main.children]
  const declared = (key) => (child) => child.classList.contains(`fm_${key}`)

  const heading = children.find(child => child.tagName === "H1")
  const date = children.find(declared("date"))
  const image = children.find(declared("image"))
  const description = children.find(declared("description"))

  const natural = children
    .filter(child => child.hasAttribute("itemprop") && ![...child.classList].some(name => name.startsWith("fm_")))
    .map(naturalLine)
    .filter(Boolean)

  const known = {
    ...(date ? { date: dateFrom(date) } : {}),
    ...(image ? { image: image.getAttribute("data-original") } : {}),
    ...(description ? { description: description.textContent.trim() } : {})
  }

  // Every remaining single-item <dl> is one generic property. The
  // breadcrumb and contents navs and section#content are skipped by not
  // matching.
  const generic = children
    .filter(child => child.tagName === "DL")
    .reduce((accumulated, list) => ({ ...accumulated, ...objectFrom(list) }), {})

  return {
    title: heading ? heading.textContent.trim() : null,
    titleDeclared: Boolean(heading?.classList.contains("fm_title")),
    properties: { ...known, ...generic },
    natural: natural.length ? `${natural.join("\n\n")}\n\n` : ""
  }
}
