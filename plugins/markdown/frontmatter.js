import yaml from "yaml"
import path from "node:path"
import { fromMarkdown } from "mdast-util-from-markdown"
import extractDate from "../../extractDate.js"

/**
 * How vowel handles a frontmatter block. Stated once, here, per Sam
 * (Sept 19); votive's side of the same policy is `votive/lib/attempt.js`.
 *
 * 1. **YAML that does not parse is not frontmatter.** The block goes
 *    back into the content as the markdown it would have been without
 *    the frontmatter extension - the `---` lines are thematic breaks,
 *    the lines between them prose - and an error names the file and the
 *    parser's complaint. Nothing is inferred from it. (`readFrontmatter`)
 *
 * 2. **A value that is not what vowel expects is logged and coerced.**
 *    `EXPECTED` below is the contract, one entry per key vowel reads:
 *    the shape it wants and how a wrong one is coerced. A coercion that
 *    can recover a value does (`title: [a, b]` → "a, b"; `tags: x` →
 *    ["x"]; `image: {src: x}` → "x"; `date: 03/04/2026` → ISO); one that
 *    cannot drops the key (`date: Thursday`), so downstream code never
 *    sees a shape it did not ask for. Either way one error line names
 *    the file, the key and what was found. Keys not in the table are the
 *    author's own and are stored as written. (`coerce`)
 *
 * 3. **A path is a URL path from the root.** `logo: x.svg` and
 *    `logo: /x.svg` both mean `/x.svg`; `./x.svg` is resolved against
 *    the file's own folder. Lowercased, because every url vowel routes
 *    is. (`resolvePath`)
 *
 * A filename vowel cannot route (a malformed `##` marker) is the
 * router's to refuse; votive logs the refusal and ignores the file.
 */

/**
 * @typedef {"string" | "date" | "path" | "boolean" | "number" | "strings" | "theme" | "links" | "object"} Shape
 */

/**
 * The keys vowel reads and the shape each one has. Everything else in a
 * frontmatter block is the author's own data.
 * @type {Record<string, Shape>}
 */
const EXPECTED = {
  title: "string",
  breadcrumb: "string",
  description: "string",
  tagline: "string",
  name: "string",
  author: "string",
  domain: "string",
  date: "date",
  image: "path",
  logo: "path",
  wordmark: "path",
  icon: "path",
  tags: "strings",
  aliases: "strings",
  published: "boolean",
  html_file: "boolean",
  rss_item: "boolean",
  sitemap_item: "boolean",
  global_menu_item: "boolean",
  local_menu_item: "boolean",
  feed_limit: "number",
  theme: "theme",
  social_links: "links",
  robots: "object",
  atproto: "object"
}

/** @param {unknown} value */
const isScalar = (value) => ["string", "number", "boolean"].includes(typeof value)

/** @param {unknown} value */
const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)

/**
 * A date in whatever shape it was written - a Date the parser made,
 * "2026-03-04", "January 5, 1000" - as ISO, or undefined when it is not
 * one. ISO sorts lexically (orderBy relies on it) and toISOString pads
 * the year, so 0999 sorts before 1000.
 * @param {unknown} value
 */
function toISODate(value) {
  const parsed = value instanceof Date ? value : isScalar(value) ? extractDate(String(value)) : null
  if (!parsed || isNaN(Number(parsed))) return undefined
  return parsed.toISOString()
}

/**
 * A URL path from the root. `./x` is the file's own folder; anything
 * else is root-relative whether or not it starts with `/`.
 * @param {string} value
 * @param {string} folder - the file's folder, project-relative ("" at the root)
 */
function resolvePath(value, folder) {
  const trimmed = value.trim()
  if (/^[a-z]+:/i.test(trimmed)) return trimmed
  const relative = trimmed.startsWith("./") || trimmed.startsWith("../")
  const joined = relative ? path.posix.join("/", folder.split(path.sep).join("/"), trimmed) : path.posix.join("/", trimmed)
  return joined.toLowerCase()
}

/**
 * One value against one shape. Returns the value to store, or undefined
 * to drop the key; `problem` says what was wrong when it was.
 * @param {Shape} shape
 * @param {unknown} value
 * @param {string} folder
 * @returns {{ value: unknown, problem?: string }}
 */
function coerceOne(shape, value, folder) {
  if (shape === "string") {
    if (typeof value === "string") return { value }
    if (isScalar(value) || value instanceof Date) return { value: String(value), problem: `expected text, got ${typeof value}` }
    if (Array.isArray(value) && value.every(isScalar)) return { value: value.map(String).join(", "), problem: "expected text, got a list" }
    return { value: undefined, problem: `expected text, got ${Array.isArray(value) ? "a list" : "an object"}` }
  }
  if (shape === "date") {
    const iso = toISODate(value)
    if (iso !== undefined) return { value: iso }
    return { value: undefined, problem: `expected a date, got ${JSON.stringify(value)}` }
  }
  if (shape === "path") {
    if (typeof value === "string" && value.trim()) return { value: resolvePath(value, folder) }
    const inner = isPlainObject(value) ? [value.src, value.url, value.path].find(candidate => typeof candidate === "string") : Array.isArray(value) ? value.find(candidate => typeof candidate === "string") : undefined
    if (inner) return { value: resolvePath(inner, folder), problem: `expected a path, got ${Array.isArray(value) ? "a list" : "an object"}; using "${inner}"` }
    return { value: undefined, problem: `expected a path, got ${JSON.stringify(value)}` }
  }
  if (shape === "boolean") {
    if (typeof value === "boolean") return { value }
    const word = String(value).trim().toLowerCase()
    if (["true", "yes", "1", "on"].includes(word)) return { value: true, problem: `expected true or false, got ${JSON.stringify(value)}` }
    if (["false", "no", "0", "off"].includes(word)) return { value: false, problem: `expected true or false, got ${JSON.stringify(value)}` }
    return { value: undefined, problem: `expected true or false, got ${JSON.stringify(value)}` }
  }
  if (shape === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return { value }
    const parsed = Number(value)
    if (typeof value === "string" && value.trim() && Number.isFinite(parsed)) return { value: parsed, problem: `expected a number, got text` }
    return { value: undefined, problem: `expected a number, got ${JSON.stringify(value)}` }
  }
  if (shape === "strings") {
    if (Array.isArray(value)) {
      const kept = value.filter(isScalar).map(String)
      return kept.length === value.length ? { value: kept } : { value: kept, problem: "expected a list of text; dropped what was not" }
    }
    if (isScalar(value)) return { value: [String(value)], problem: "expected a list, got one value" }
    return { value: undefined, problem: `expected a list, got ${JSON.stringify(value)}` }
  }
  if (shape === "theme") {
    if (typeof value === "string") return { value }
    if (isPlainObject(value)) return { value }
    return { value: undefined, problem: `expected a theme name or an object, got ${JSON.stringify(value)}` }
  }
  if (shape === "links") {
    if (!Array.isArray(value)) return { value: undefined, problem: "expected a list of links" }
    const kept = value
      .filter(link => isPlainObject(link) && typeof link.url === "string")
      .map(link => typeof link.icon === "string" ? { ...link, icon: resolvePath(link.icon, folder) } : link)
    return kept.length === value.length ? { value: kept } : { value: kept, problem: "expected every link to have a url; dropped those without" }
  }
  if (shape === "object") {
    if (isPlainObject(value)) return { value }
    return { value: undefined, problem: `expected an object, got ${JSON.stringify(value)}` }
  }
  return { value }
}

/**
 * The block's values, each known key checked against EXPECTED. Returns
 * a new object; keys coerced away are absent from it.
 * @param {Record<string, unknown>} frontmatter
 * @param {string} filePath - project-relative, for the error line
 * @param {string} folder - the folder paths resolve against
 * @param {(message: string) => void} report
 */
function coerce(frontmatter, filePath, folder, report) {
  const result = {}
  for (const key in frontmatter) {
    const shape = EXPECTED[key]
    if (!shape) {
      result[key] = frontmatter[key]
      continue
    }
    const { value, problem } = coerceOne(shape, frontmatter[key], folder)
    if (problem) report(`${filePath}: \`${key}:\` ${problem}${value === undefined ? "; ignoring it" : ""}`)
    if (value !== undefined) result[key] = value
  }
  return result
}

/**
 * Parses a frontmatter node. On a parse error the node is replaced in
 * the tree by the markdown it would have been - rule 1 above - and
 * nothing is returned.
 * @param {object} tree - the mdast root
 * @param {object} node - its `yaml` child
 * @param {string} filePath
 * @param {(message: string) => void} report
 * @returns {Record<string, unknown> | undefined}
 */
function parseFrontmatter(tree, node, filePath, report) {
  try {
    const parsed = yaml.parse(node.value)
    if (parsed === null || parsed === undefined) return {}
    if (!isPlainObject(parsed)) {
      report(`${filePath}: frontmatter is ${Array.isArray(parsed) ? "a list" : "a single value"}, not a mapping; rendering it as content`)
      return asContent(tree, node)
    }
    return parsed
  } catch (error) {
    report(`${filePath}: frontmatter could not be parsed (${String(error.message).split("\n")[0]}); rendering it as content`)
    return asContent(tree, node)
  }
}

/**
 * Puts a block back as content: `---`, its lines, `---`, parsed as
 * ordinary markdown, in the node's place.
 * @param {object} tree
 * @param {object} node
 */
function asContent(tree, node) {
  const replacement = fromMarkdown(`---\n${node.value}\n---\n`).children
  tree.children.splice(tree.children.indexOf(node), 1, ...replacement)
  return undefined
}

export { EXPECTED, coerce, parseFrontmatter, resolvePath, toISODate }
