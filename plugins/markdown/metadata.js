import { toString as mdastToString } from 'mdast-util-to-string'
import extractDate, { dateSpan } from "./../../extractDate.js"
import { testURL, labelFromName } from "./../../utils.js"
import path from "node:path"
import { displayPath } from "../../secretPaths.js"
import pathDate from "../../pathDate.js"
import { coerce, parseFrontmatter, toISODate } from "./frontmatter.js"


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
/**
 * Frontmatter keys that never render into the page.
 *
 * Empty, and deliberately kept: `secret_key` was the only entry and
 * secrecy is a path property now (see secretPaths.js), but the mechanism
 * costs one filter call and the next key that must not be displayed will
 * want it. See tasks/1-proposed/post-stubs-vowel-followups.md.
 */
export const hiddenProperties = []

export const reservedProperties = [
  "rss_item",
  "sitemap_item",
  "html_file",
  "global_nav_item",
  "local_nav_item",
  "theme",
  "logo",
  "wordmark"
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
 * Marks a recognized date so it renders as <time>, keeping the author's
 * wording. The editor reads the element's text back, so that wording
 * survives the round trip and the markup is simply re-inferred on the
 * next build.
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
 * Recognizable data that may precede the content. A block is data only
 * when the property it would fill is still empty: a date line on a page
 * whose frontmatter has a `date:`, or a second date line, is content,
 * and the scan stops there (per Sam). Returns what the block is: "date"
 * or "image" for natural metadata, which the html plugin lifts out of
 * the content and renders with the page's metadata (the source is never
 * changed); "skip" for a line that is neither metadata nor content (a
 * listing, a bare url); false for content. Adding another inferred
 * property later (an ISBN, say) means adding a branch here, not new
 * plumbing.
 *
 * @param {object} block
 * @param {object} metadata
 * @returns {boolean} whether the block was recognizable data
 */
function recognizeData(block, metadata) {
  if (block.type !== "paragraph") return false
  if (block.children.length !== 1) return false

  const [child] = block.children

  const imageFilled = Boolean(metadata.fm_image || metadata.inferred_image)

  if (child.type === "image") {
    if (imageFilled) return false
    metadata.inferred_image = child.url
    metadata.inferred_alt_text = child.alt
    return "image"
  }

  const text = mdastToString(block)

  // A reference or a listing directive (`/blog/post`, `/blog/**`,
  // `./drafts/*`) is an instruction to the html plugin, not prose - it
  // must not become the page's description, which is what a section
  // index's own listing line was doing. Same test as writeRules'
  // directive rule.
  if (child.type === "text" && /^(\/|\.\.?\/)\S*$/.test(text.trim())) return "skip"

  if (testURL(text)) {
    const url = new URL(text)
    if (text.match(/\.(jpeg|jpg|png)$/)) {
      if (imageFilled) return false
      metadata.inferred_image = url
    } else {
      metadata.inferred_link = url
    }
    return "skip"
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
  if (metadata.fm_date || metadata.inferred_date) return false

  // Stored as ISO, like a frontmatter date (frontmatter.js, toISODate):
  // one format in the column, which sorts lexically.
  metadata.inferred_date = toISODate(date)
  markAsTime(block, date)
  return "date"
}

/**
 * Marks a block as natural metadata - written in the text, not the
 * frontmatter - for the html plugin to lift out of the content
 * (`data-metadata`, which it removes): "date", "image", "description",
 * or "end" for the rule that closed the description, which renders as
 * nothing. A description is marked as one where it is rendered.
 * @param {object} block
 * @param {"date" | "image" | "description" | "end"} kind
 */
function markAsNatural(block, kind) {
  const itemprop = kind === "description" ? { itemprop: "description" } : {}
  const hProperties = { ...block.data?.hProperties, ...itemprop, dataMetadata: kind }
  block.data = { ...block.data, hProperties }
}

/**
 * The frontmatter block into metadata, under frontmatter.js's rules:
 * unparseable YAML goes back into the content, and every key vowel
 * reads is checked and coerced, with one error line per problem.
 * @param {object} tree
 * @param {object} node
 * @param {object} metadata
 * @param {string} filePath
 * @param {string} folder - what `./` paths resolve against
 * @param {(message: string) => void} report
 */
function readFrontmatter(tree, node, metadata, filePath, folder, report) {
  const parsed = parseFrontmatter(tree, node, filePath, report)
  if (!parsed) return

  const frontmatter = coerce(parsed, filePath, folder, report)

  for (const key in frontmatter) {
    const name = reservedProperties.includes(key) ? key : "fm_" + key
    metadata[name] = frontmatter[key]
  }

  // Recorded because presence alone cannot distinguish a property the
  // author wrote from one selectMetadata derived: breadcrumb defaults to
  // the title, and would otherwise render as though it had been declared.
  // The keys as written, so a coerced-away key still counts as declared.
  metadata.frontmatter_keys = Object.keys(parsed)
}

/**
 * @param {object} tree
 * @param {string} filePath - project-relative
 * @param {string | null} targetPath - project-relative, or null for a
 *   source that routes nowhere
 * @param {(message: string) => void} [report] - where a problem with the
 *   file's frontmatter is told (frontmatter.js); the caller's error log
 */
function getMetadata(tree, filePath, targetPath, report = () => {}) {
  const metadata = {}

  const frontmatterNode = tree.children.find(child => child.type === "yaml")
  // Paths resolve against where the page is published - the target's
  // folder, which for a secret folder is the hashed one - or, for a
  // source with no target, where it would have been.
  const folder = path.dirname(targetPath ?? filePath).replace(/^\.$/, "")
  if (frontmatterNode) readFrontmatter(tree, frontmatterNode, metadata, filePath, folder, report)

  const titleNode = findTitleNode(tree)
  if (titleNode) {
    metadata.inferred_title = mdastToString(titleNode) || labelFromName(path.parse(filePath).name)
  }

  // Everything up to the first block that is not recognizable data is
  // metadata; that first block is where the content begins, and it also
  // supplies the description.
  const blocks = tree.children.filter(child => child.type !== "yaml" && child !== titleNode)

  for (const [index, block] of blocks.entries()) {
    const recognized = recognizeData(block, metadata)
    if (recognized === "skip") continue
    if (recognized) {
      markAsNatural(block, recognized)
      continue
    }

    // One paragraph and then a rule: the author ended their metadata
    // with the rule, so the paragraph *is* the description - stated,
    // not guessed, so it outranks a slogan. With a `description:` in the
    // frontmatter it is an ordinary paragraph, and the rule an ordinary
    // rule. (`text` then `---` on the next line is a heading in
    // markdown, not a paragraph and a rule; it takes a blank line.)
    const next = blocks[index + 1]
    if (!metadata.fm_description && block.type === "paragraph" && next?.type === "thematicBreak") {
      metadata.declared_description = mdastToString(block)
      markAsNatural(block, "description")
      markAsNatural(next, "end")
      break
    }

    if (!metadata.fm_description) metadata.inferred_description = mdastToString(block)
    break
  }

  // The title is the single exception to leaving data in place: it is
  // hoisted out of the content and rendered as main's first child.
  if (titleNode) {
    tree.children.splice(tree.children.indexOf(titleNode), 1)
  }

  // Through displayPath first: a secret segment carries its salt in the
  // source filename, and inferred_label feeds both `title` and
  // `breadcrumb`. This is the one place a filename becomes text a reader
  // sees, so it is the one place the salt has to be stripped.
  const pathInfo = path.parse(displayPath(filePath))

  // A date the author wrote wins; failing that, the one the path spells
  // (`journal/2024/april/1.md`).
  if (!metadata.fm_date && !metadata.inferred_date) {
    const date = pathDate(displayPath(filePath))
    if (date) metadata.inferred_date = toISODate(date)
  }

  metadata.inferred_label = labelFromName(pathInfo.name)

  // What a [[wikilink]] matches, the way Obsidian matches: the filename
  // without its extension, case-insensitively, plus any `aliases:` the
  // author declared. Lowercased here once so the lookup is one equality
  // (writeRules.js, resolveNote).
  metadata.note_key = pathInfo.name.toLowerCase()
  if (Array.isArray(metadata.fm_aliases)) metadata.note_aliases = metadata.fm_aliases.map(alias => String(alias).toLowerCase())

  if (targetPath) {
    const targetInfo = path.parse(targetPath)
    // Only the root's index.html is `/`; `blog/index.html` is a page
    // called index, at `/blog/index`.
    const name = targetInfo.name === "index" && !targetInfo.dir ? "" : targetInfo.name
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
    || metadata.declared_description
    || metadata.fm_slogan
    || metadata.inferred_description

  if (description) {
    metadata.description = description
  }

  // The page's own author, for its feed entry. The site's `author` in
  // settings.md is the feed's; Atom applies it to any entry without one.
  if (metadata.fm_author) {
    metadata.author = metadata.fm_author
  }

  const image =
    metadata.fm_image
    || metadata.inferred_image

  if (image) {
    metadata.image = image
  }
}

export default getMetadata
