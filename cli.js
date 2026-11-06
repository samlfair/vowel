import { copyFile, mkdir, writeFile, constants } from "node:fs/promises"
import path from "node:path"
import yaml from "yaml"

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

/** The themes the wizard and `vowel init --theme` offer. */
export const THEMES = ["default", "typography", "reset"]

/** `vowel init`'s flags: one per wizard question, and `--force`. */
const INIT_FLAGS = ["name", "theme", "domain", "author", "home", "slogan", "agents", "skill", "force"]

/**
 * What a new site starts with: the wizard's answers, or `vowel init`'s
 * flags, which are the same questions.
 * @typedef {object} SiteAnswers
 * @property {string} [name] - the site's name
 * @property {string} [theme] - one of THEMES
 * @property {string} [domain] - as typed or pasted; normalized here
 * @property {string} [author] - the feed's author
 * @property {boolean} [home] - write a home.md; true unless false
 * @property {string} [slogan] - the homepage's
 * @property {boolean} [agents] - write AGENTS.md
 * @property {boolean} [skill] - copy the Vowel skill into .claude/skills
 */

/**
 * A frontmatter block from the values that are set. YAML-quoted where a
 * value needs it: a name with a colon in it used to break settings.md.
 * @param {Record<string, unknown>} values
 */
function frontmatterBlock(values) {
  const set = Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
  if (!set.length) return "---\n---\n"
  return `---\n${yaml.stringify(Object.fromEntries(set))}---\n`
}

/** A new site's name when it was given none. */
export const DEFAULT_NAME = "Site Name"

/**
 * What an empty key in a new settings.md is for, as a comment beside it.
 * An empty key is not set (frontmatter.js), so it shows the author the
 * setting without pretending to know its value.
 */
const EMPTY_KEY_HINTS = {
  domain: "like example.com, for the feed, the sitemap and llms.txt",
  author: "your name, for the feed"
}

/**
 * settings.md's frontmatter: a value as YAML, an empty key (null) with
 * its hint, nothing for undefined.
 * @param {Record<string, unknown>} values
 */
function settingsBlock(values) {
  const lines = Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => value === null ? `${key}: # ${EMPTY_KEY_HINTS[key]}\n` : yaml.stringify({ [key]: value }))
  return `---\n${lines.join("")}---\n`
}

/**
 * The text of a new site's own files: settings.md, and home.md unless
 * `home` is false. What wasn't answered gets a default: the name
 * DEFAULT_NAME, the default theme, and an empty `domain:` and `author:`
 * to fill in. The wizard's "None" theme (`theme: false`) writes no theme.
 * @param {SiteAnswers} answers
 * @returns {{ path: string, text: string }[]}
 */
export function siteFiles(answers) {
  const text = (value) => value === undefined || value === null || value === false ? undefined : String(value).trim()
  const theme = answers.theme === false ? undefined : text(answers.theme)?.toLowerCase() || "default"
  const settings = settingsBlock({
    name: text(answers.name) || DEFAULT_NAME,
    theme,
    domain: normalizeDomain(text(answers.domain)) || null,
    author: text(answers.author) || null
  })
  const slogan = text(answers.slogan)
  const home = `${slogan ? frontmatterBlock({ slogan }) : ""}# Home\n\nWelcome home!\n`
  return [
    { path: "settings.md", text: settings },
    ...(answers.home === false ? [] : [{ path: "home.md", text: home }])
  ]
}

/**
 * What to tell the person about the defaults a new settings.md got,
 * once it has been written: the placeholder name, and the domain left
 * to fill in, which `vowel check` warns about until it is.
 * @param {SiteAnswers} answers
 * @param {string[]} written - what writeSite() wrote
 * @returns {string[]}
 */
export function defaultsNotes(answers, written) {
  if (!written.includes("settings.md")) return []
  const named = String(answers.name ?? "").trim()
  const domain = normalizeDomain(String(answers.domain ?? "").trim())
  return [
    ...(named ? [] : [`Named the site "${DEFAULT_NAME}". Change \`name:\` in settings.md.`]),
    ...(domain ? [] : ["Left `domain:` in settings.md empty. Set it to the site's domain for a feed and a sitemap, or remove it if the site has none."])
  ]
}

/**
 * The name the wizard suggests: the folder's, in title case
 * (`my-blog` is "My Blog"), or DEFAULT_NAME for a folder with no name
 * of its own to give, the file system's root or the home folder, whose
 * name is a person's user name. The wizard shows it before writing it,
 * so a folder's private name is never published unseen; `vowel init`
 * without `--name` uses DEFAULT_NAME (per Sam, Nov 6).
 * @param {string} folder - absolute
 * @param {string} home - the home folder
 */
export function nameFromFolder(folder, home) {
  if (path.resolve(folder) === path.resolve(home)) return DEFAULT_NAME
  const words = path.basename(path.resolve(folder)).split(/[-_\s]+/).filter(Boolean)
  if (!words.length) return DEFAULT_NAME
  return words.map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
}

/**
 * Writes a file only where there is none.
 * @param {string} file
 * @param {string} text
 * @returns {Promise<boolean>} whether it was written
 */
async function writeNew(file, text) {
  try {
    await writeFile(file, text, { encoding: "utf-8", flag: "wx" })
    return true
  } catch (error) {
    if (error.code === "EEXIST") return false
    throw error
  }
}

/**
 * Sets up a site in `folder`, for the wizard and for `vowel init`: its
 * own files, then the agent files asked for. Nothing that exists is
 * replaced, so it is safe in a folder that is a site already: `vowel
 * init --agents` there adds AGENTS.md and nothing else.
 * @param {string} folder
 * @param {SiteAnswers} answers
 * @returns {Promise<{ written: string[], kept: string[] }>} project-relative
 */
export async function writeSite(folder, answers) {
  const files = siteFiles(answers)
  const wroteFiles = await Promise.all(files.map(file => writeNew(path.join(folder, file.path), file.text)))
  const agents = await writeAgentFiles(folder, answers)
  const askedAgents = Object.entries(AGENT_FILES).filter(([key]) => answers[key]).map(([, { to }]) => to)
  return {
    written: [...files.filter((_, index) => wroteFiles[index]).map(file => file.path), ...agents],
    kept: [...files.filter((_, index) => !wroteFiles[index]).map(file => file.path), ...askedAgents.filter(file => !agents.includes(file))]
  }
}

/**
 * Whether `vowel init` was given answers, rather than asked to run the
 * wizard: any flag but `--force`.
 * @param {Record<string, unknown>} args - as @bomb.sh/args parses them
 */
export function hasInitAnswers(args) {
  return INIT_FLAGS.some(flag => flag !== "force" && args[flag] !== undefined)
}

/**
 * What is wrong with `vowel init`'s flags, as the message to print, or
 * undefined. A misspelled flag is an error rather than ignored: an
 * agent's typo would otherwise make a site without what it asked for.
 * @param {Record<string, unknown>} args
 * @param {string[]} [globalFlags] - flags every launch accepts
 * @returns {string | undefined}
 */
export function initProblem(args, globalFlags = ["logging"]) {
  const known = [...INIT_FLAGS, ...globalFlags, "_"]
  const unknown = Object.keys(args).filter(key => !known.includes(key))
  if (unknown.length) return `vowel init: unknown option ${unknown.map(key => `--${key}`).join(", ")}. The options are ${INIT_FLAGS.map(flag => `--${flag}`).join(", ")}.`
  if (args.theme !== undefined && !THEMES.includes(String(args.theme).toLowerCase())) {
    return `vowel init: --theme must be ${THEMES.join(", ")}; got ${JSON.stringify(args.theme)}.`
  }
  return undefined
}
