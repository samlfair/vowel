import { toString as mdastToString } from 'mdast-util-to-string'
import extractDate, { dateSpan } from "./../../extractDate.js"
import { testURL, toTitleCase } from "./../../utils.js"
import yaml from 'yaml'
import path from "node:path"


/**
- menu_item: true | false
- secret_url: true | false
*/

// Frontmatter keys that are vowel's own controls rather than content, and
// so keep their bare name instead of being prefixed.
/**
 * Frontmatter keys that are recorded in metadata but never rendered into
 * the page. The editor reproduces a file's frontmatter from the source
 * (GET <page>?source), not from what it rendered, so a key can be kept
 * out of the page without being lost on save. `secret_key` is the case
 * that forced it: the page rendered its own key, and the secret URLs of
 * every page sharing that key follow from it.
 */
export const hiddenProperties = [
  "secret_key"
]

export const reservedProperties = [
  "rss_item",
  "sitemap_item",
  "html_file",
  "global_menu_item",
  "local_menu_item",
  "secret_key",
  "theme",
  "logo",
  "wordmark",
  "breadcrumb"
]

/**
 * A "#" heading is the page title only in first position (frontmatter
 * aside). Anywhere else it is an ordinary heading and gets demoted to h2
 * by normalizeHeadingLevels.
 * @param {object} tree
 */
export function findTitleNode(tree) {
  const [first] = tree.children.filter(child => child.type !== "yaml")
  if (!first) return null
  if (first.type !== "heading" || first.depth !== 1) return null
  return first
}

/**
 * Replaces mdast-normalize-headings, which shifts every heading to
 * guarantee a single h1 - a different rule that would fight this one.
 * @param {object} tree
 */
export function normalizeHeadingLevels(tree) {
  const titleNode = findTitleNode(tree)

  for (const child of tree.children) {
    if (child.type !== "heading") continue
    if (child === titleNode) continue
    if (child.depth === 1) child.depth = 2
  }
}

/**
 * Dates reach metadata in whatever shape they were written - a Date from
 * extractDate, "2026-03-04" or "January 5, 1000" from frontmatter. They are
 * stored as ISO so the column holds one format: it sorts lexically, which is
 * what orderBy relies on, and toISOString pads the year to four digits, so
 * 0999 still sorts before 1000. Anything that is not a date is left alone.
 * @param {unknown} value
 */
function normalizeDate(value) {
  const parsed = value instanceof Date ? value : extractDate(String(value))
  if (!parsed || isNaN(parsed)) return value
  return parsed.toISOString()
}

/**
 * Marks a recognized date in place so it renders as <time> without moving
 * out of the content. The editor reads the element's text back, so the
 * author's own wording survives the round trip and the markup is simply
 * re-inferred on the next build.
 * @param {object} paragraph
 * @param {Date} date
 */
function markAsTime(paragraph, date) {
  paragraph.children = [{
    type: "time",
    datetime: date.toISOString(),
    children: paragraph.children
  }]
}

/**
 * Recognizable data that may precede the content. Each block is recorded
 * where the author placed it and never relocated - only the title is
 * hoisted (see findTitleNode). Adding another inferred property later (an
 * ISBN, say) means adding a branch here, not new plumbing.
 *
 * @param {object} block
 * @param {object} metadata
 * @returns {boolean} whether the block was recognizable data
 */
function recognizeData(block, metadata) {
  if (block.type !== "paragraph") return false
  if (block.children.length !== 1) return false

  const [child] = block.children

  if (child.type === "image") {
    metadata.inferred_image = child.url
    metadata.inferred_alt_text = child.alt
    return true
  }

  const text = mdastToString(block)

  if (testURL(text)) {
    const url = new URL(text)
    if (text.match(/\.(jpeg|jpg|png)$/)) {
      metadata.inferred_image = url
    } else {
      metadata.inferred_link = url
    }
    return true
  }

  // A date is a property of the page only when the author wrote it as
  // the whole paragraph and nothing else: one unmarked text node. Bold,
  // italic, a link, or code around it makes it prose that happens to
  // contain a date - the paragraph is saying something, not declaring a
  // field. (Siblings are already excluded by the single-child check
  // above.)
  if (child.type !== "text") return false

  // And it has to *be* the date, not mention one. mdast hands back
  // "Published on 2026-03-04 by us." as a single text node, so the
  // single-child check above cannot tell that apart from a bare date.
  const span = dateSpan(text)
  if (!span || span.trim() !== text.trim()) return false

  const date = extractDate(text)
  if (!date) return false

  metadata.inferred_date = normalizeDate(date)
  markAsTime(block, date)
  return true
}

/**
 * @param {object} node
 * @param {object} metadata
 */
function readFrontmatter(node, metadata) {
  const frontmatter = yaml.parse(node.value)

  for (const key in frontmatter) {
    const name = reservedProperties.includes(key) ? key : "fm_" + key
    metadata[name] = key === "date" ? normalizeDate(frontmatter[key]) : frontmatter[key]
  }

  // Recorded because presence alone cannot distinguish a property the
  // author wrote from one selectMetadata derived: breadcrumb defaults to
  // the title, and would otherwise render as though it had been declared.
  metadata.frontmatter_keys = Object.keys(frontmatter)
}

/**
 * @param {object} tree
 * @param {string} filePath
 * @param {string} targetPath
 */
function getMetadata(tree, filePath, targetPath) {
  const metadata = {}

  const frontmatterNode = tree.children.find(child => child.type === "yaml")
  if (frontmatterNode) readFrontmatter(frontmatterNode, metadata)

  const titleNode = findTitleNode(tree)
  if (titleNode) {
    metadata.inferred_title = mdastToString(titleNode) || toTitleCase(path.parse(filePath).name)
  }

  // Everything up to the first block that is not recognizable data is
  // metadata; that first block is where the content begins, and it also
  // supplies the description.
  const blocks = tree.children.filter(child => child.type !== "yaml" && child !== titleNode)

  for (const block of blocks) {
    const recognized = recognizeData(block, metadata)
    if (recognized) continue

    if (!metadata.fm_description) metadata.inferred_description = mdastToString(block)
    break
  }

  // The title is the single exception to leaving data in place: it is
  // hoisted out of the content and rendered as main's first child.
  if (titleNode) {
    tree.children.splice(tree.children.indexOf(titleNode), 1)
  }

  const pathInfo = path.parse(filePath)

  metadata.inferred_label = toTitleCase(pathInfo.name)

  if (targetPath) {
    const targetInfo = path.parse(targetPath)
    const name = targetInfo.name === "index" ? "" : targetInfo.name
    // FIXME the prettyURL should include the preceding slash
    metadata.prettyURL = (new URL(`${targetInfo.dir}/${name}`, "thismessage:/")).pathname
  }

  selectMetadata(metadata)

  return metadata
}



function selectMetadata(metadata) {
  const date =
    metadata.fm_date
    || metadata.inferred_date

  if (date) {
    metadata.date = date
  }

  const title =
    metadata.fm_title
    || metadata.inferred_title
    || metadata.inferred_label

  if (title) {
    metadata.title = title
  }

  const breadcrumb =
    metadata.fm_breadcrumb
    || metadata.title
    || metadata.inferred_label

  if (breadcrumb) {
    metadata.breadcrumb = breadcrumb
  }

  const description =
    metadata.fm_description
    || metadata.tagline
    || metadata.inferred_description

  if (description) {
    metadata.description = description
  }

  const image =
    metadata.fm_image
    || metadata.inferred_image

  if (image) {
    metadata.image = image
  }
}

export default getMetadata
