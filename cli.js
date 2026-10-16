/**
 * Decisions the CLI makes from its arguments, kept out of bin.js so they
 * can be tested without launching a server.
 */

/**
 * Whether this launch starts cold. `--clear` and `--reset` are the same
 * flag; anything else is a warm start that reuses the database and the
 * output, so a second launch on an unchanged site has nothing to do.
 * The wipe on every launch was a development convenience.
 * @param {Record<string, unknown>} args - as @bomb.sh/args parses them
 */
export function shouldClear(args) {
  return Boolean(args?.clear || args?.reset)
}

/**
 * A domain as settings.md wants it: `https://Example.com/` → `example.com`.
 * What the wizard's prompt gets is whatever someone pasted from a browser.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeDomain(value) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/^[a-z]+:\/\//i, "").replace(/\/+$/, "").toLowerCase()
}

/**
 * Whether this looks like the wrong folder to make a site in, and why,
 * as the question to ask - or undefined when it looks fine. Vowel makes
 * a site from everything in the folder it runs in, so starting it in a
 * home folder, or a folder of other things, sets up and scans all of
 * it. A new, empty folder is fine; so is one with markdown in it.
 * Only asked when there is no settings.md: a folder that has one is a
 * site already.
 * @param {string[]} entries - the folder's own entries, by name
 * @param {{ folder: string, home: boolean }} where
 * @returns {string | undefined}
 */
export function wrongFolderWarning(entries, { folder, home }) {
  const visible = entries.filter(name => !name.startsWith("."))
  const markdown = visible.filter(name => name.toLowerCase().endsWith(".md"))
  if (home) return `${folder} is your home folder. Vowel makes a website from everything in the folder it runs in. Set up a site here anyway?`
  if (markdown.length || !visible.length) return undefined
  const others = visible.length === 1 ? "1 other thing" : `${visible.length} other things`
  return `${folder} has no markdown files, and ${others} in it. Vowel makes a website from everything in the folder it runs in. Set up a site here anyway?`
}
