// Reading and writing the project's settings.md from the browser.
//
// The preview hands the root settings.md over with the page (source.js),
// and votive's POST endpoint writes it back. No endpoint to read it, and
// no settings.md target on the site - the panel edits the same file a
// person would open in an editor.

import { parse, stringify } from "yaml"
import { getSource, updateSettings } from "./source.js"

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/

/**
 * Splits a markdown file into its frontmatter mapping and everything
 * after it. The body is kept as raw text and never parsed: only the
 * frontmatter is rewritten on save, so prose survives a round trip
 * byte for byte.
 * @param {string} text
 */
export function splitFrontmatter(text) {
  const match = text.match(FRONTMATTER)
  if (!match) return { data: {}, body: text, had: false }

  const data = parse(match[1]) || {}
  return { data, body: text.slice(match[0].length), had: true }
}

/**
 * The inverse. YAML comments and key order inside the frontmatter are
 * lost here - the same trade the markdown round trip already makes, and
 * the reason the body is spliced back rather than re-emitted.
 * @param {object} data
 * @param {string} body
 */
export function joinFrontmatter(data, body) {
  return `---\n${stringify(data)}---\n${body.replace(/^\r?\n/, "")}`
}

/**
 * The theme mapping, always as an object. `theme: default` is the short
 * form of `{name: default}`, and a panel that is about to write a font
 * into it needs the long one.
 * @param {unknown} theme
 */
export function themeObject(theme) {
  if (theme && typeof theme === "object" && !Array.isArray(theme)) return { ...theme }
  if (typeof theme === "string") return { name: theme }
  return {}
}

/**
 * The root settings.md, as the preview handed it over (see source.js).
 * A project with none yet reads as an empty file, so the panel can
 * create it on first save.
 */
export async function readSettings() {
  const { settings } = getSource()
  return splitFrontmatter(settings.markdown ?? "")
}

/**
 * Writes the file back through votive's write endpoint, which resolves the
 * path under sourceFolder and refuses anything outside it. The rebuild
 * needs no trigger: the same watcher that sees a hand edit sees this one.
 * @param {string} filePath
 * @param {string} data
 */
export async function writeSettings(filePath, data) {
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "file", filePath, data })
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.error || `write failed (${response.status})`)
  }

  // What was written is the newest copy until the rebuild pushes one.
  updateSettings(data)
  return response.json()
}
