import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"

/**
 * `vowel check` (or `vowel --command check`): builds the site once and
 * lists every warning and error the build logged, each at its place in
 * the source (`home.md:6:15: link to /nowhere matches no page`), then
 * fails when there were any. A person sees what to fix; an agent or CI
 * gets an exit code. Warnings fail it too: a link that would 404 is only
 * a warning, and it is what a check is for.
 *
 * Every warning is already reported through `config.log`, so the check
 * is a log that collects rather than prints. The build is a fresh one -
 * an in-memory database and a throwaway output folder - because a warm
 * build reads only what changed, and the warnings of everything else
 * would never be said. The buffer cache is shared, so images are not
 * decoded again; nothing a buffer read decides is reported at the read
 * (plugins/assets reports a file that is too large at its write).
 *
 * @param {unknown} payload
 * @param {{ config: import("votive").VotiveConfig, notify: (message: object) => void }} context
 */
async function check(payload, { config, notify }) {
  notify({ status: "progress", message: "Checking..." })

  const problems = new Map()
  /** @type {(level: "error" | "warn" | "info", message: string) => void} */
  const log = (level, message) => {
    if (level === "info") return
    // A page written again in the follow-up build warns again.
    problems.set(`${level} ${message}`, { level, message })
  }

  const targetFolder = await mkdtemp(path.join(tmpdir(), "vowel-check-"))
  try {
    const site = await votive({ ...config, log, targetFolder, databasePath: ":memory:" })
    try {
      await (await site.build()).deferred
    } finally {
      await site.close()
    }
  } finally {
    await rm(targetFolder, { recursive: true, force: true })
  }

  const sorted = [...problems.values()].sort(bySource)
  sorted.forEach(({ level, message }) => notify({ status: "progress", message: `${level === "error" ? "error" : "warning"}  ${message}` }))

  const errors = sorted.filter(({ level }) => level === "error").length
  const warnings = sorted.length - errors
  if (!sorted.length) {
    notify({ status: "done", message: "No problems found." })
    return undefined
  }
  throw new Error(`${count(errors, "error")} and ${count(warnings, "warning")}`)
}

/**
 * @param {number} n
 * @param {string} noun
 */
const count = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`

/**
 * Where a message says it is: `home.md:6:15: …`, `settings.md: …`, or,
 * for a message that names no file first, the message itself.
 * @param {string} message
 */
function sourceOf(message) {
  const match = /^(.+?)(?::(\d+))?(?::(\d+))?: /.exec(message)
  if (!match) return { file: message, line: 0, column: 0 }
  return { file: match[1], line: Number(match[2] ?? 0), column: Number(match[3] ?? 0) }
}

/**
 * By file, then line and column, so a file's problems read top to
 * bottom and the order doesn't depend on which page was written first.
 * @param {{ message: string }} a
 * @param {{ message: string }} b
 */
function bySource(a, b) {
  const left = sourceOf(a.message)
  const right = sourceOf(b.message)
  if (left.file !== right.file) return left.file < right.file ? -1 : 1
  if (left.line !== right.line) return left.line - right.line
  return left.column - right.column
}

/** @type {import("votive").VotivePlugin} */
const vowelCheckPlugin = {
  name: "vowel-check",
  commands: { check }
}

export default vowelCheckPlugin
export { check }
