import { copyFile, mkdir, constants } from "node:fs/promises"
import path from "node:path"

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

/** What the wizard offers to write for AI agents, from vowel's own package. */
const AGENT_FILES = {
  agents: { from: path.join(import.meta.dirname, "templates", "AGENTS.md"), to: "AGENTS.md" },
  skill: { from: path.join(import.meta.dirname, "skills", "vowel", "SKILL.md"), to: path.join(".claude", "skills", "vowel", "SKILL.md") }
}

/**
 * Copies a file only where there is none: a file the author already has
 * is theirs, edited or not.
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string | undefined>} `to` when it was written
 */
async function copyNew(from, to) {
  await mkdir(path.dirname(to), { recursive: true })
  try {
    await copyFile(from, to, constants.COPYFILE_EXCL)
    return to
  } catch (error) {
    if (error.code === "EEXIST") return undefined
    throw error
  }
}

/**
 * The files the wizard offers AI agents, each written only when asked
 * for and not already there: `AGENTS.md`, notes any agent working in the
 * folder reads (templates/AGENTS.md), and the Vowel skill in
 * `.claude/skills/vowel/`, the copy in this package (skills/vowel). Both
 * are copies, so they stay at the version that wrote them; the skill
 * installed as a plugin updates with the repo.
 * @param {string} folder - the project
 * @param {{ agents?: boolean, skill?: boolean }} wanted
 * @returns {Promise<string[]>} the files written, project-relative
 */
export async function writeAgentFiles(folder, wanted) {
  const chosen = Object.entries(AGENT_FILES).filter(([key]) => wanted[key])
  const written = await Promise.all(chosen.map(([, { from, to }]) => copyNew(from, path.join(folder, to))))
  return written.filter(file => file).map(file => path.relative(folder, file))
}
