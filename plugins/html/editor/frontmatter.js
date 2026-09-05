// <main>'s children -> the page's frontmatter.
//
// The inverse of makeFrontmatter in plugins/html/index.js. Each property
// is its own single-item <dl>, except the ones vowel handles specially,
// which get their own element identified by itemprop. The title is main's
// first <h1> - the one piece of data hoisted out of the content - and is
// written back as a "#" heading rather than a frontmatter key.

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
 * @param {Element} main
 * @returns {{title: string|null, properties: object}}
 */
export default function readFrontmatter(main) {
  const children = [...main.children]

  const heading = children.find(child => child.tagName === "H1")
  const date = children.find(child => child.matches('time[itemprop="date"]'))
  const image = children.find(child => child.matches('picture[itemprop="image"]'))
  const description = children.find(child => child.matches('p[itemprop="description"]'))

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
    properties: { ...known, ...generic }
  }
}
