import { cp, readdir, stat } from "node:fs/promises"
import { realpathSync } from "node:fs"
import path from "node:path"
import votive from "votive"
import { systemDirectoryFor } from "../../systemPaths.js"

/** @import * as Votive from "votive" */

/**
 * `vowel export <folder>`: build the site and copy it to a folder of
 * your choosing - to upload anywhere, archive, or hand to someone. The
 * same command a desktop "Export" button would run
 * (`vowel --command export --payload '{"path": "…"}'`).
 *
 * It copies the output folder whole. If the output ever holds files it
 * shouldn't, that is the output's problem to fix, not the export's.
 *
 * **Where it won't write**, checked before anything is built, on real
 * paths so a symlink can't hide the answer:
 * - inside the project: the next build would read the export as content,
 *   and each export would nest inside the next
 * - a folder that contains the project, or is it
 * - vowel's own system folder (the output, the database, the cache)
 * - a folder that isn't empty: nothing an export writes should mix with,
 *   or silently replace, what's already there
 *
 * A destination that doesn't exist yet is created.
 */

/**
 * `child` is `parent` or somewhere inside it.
 * @param {string} child
 * @param {string} parent
 */
function within(child, parent) {
  const relative = path.relative(parent, child)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

/**
 * A path made real as far as it exists: the deepest existing ancestor
 * through realpath (symlinks resolved, and on a case-insensitive disk
 * its true case), then the segments that don't exist yet.
 * @param {string} absolute
 * @returns {string}
 */
function realAsFarAsItExists(absolute) {
  try {
    return realpathSync.native(absolute)
  } catch {
    const parent = path.dirname(absolute)
    if (parent === absolute) return absolute
    return path.join(realAsFarAsItExists(parent), path.basename(absolute))
  }
}

/**
 * Where an export may go, or why it may not, as a sentence. Checks the
 * places only; whether the folder is empty is `checkEmpty`'s.
 * @param {string} destination - as given; relative to the working directory
 * @param {{ sourceFolder: string, targetFolder: string }} config
 * @returns {{ path: string } | { refused: string }}
 */
function checkDestination(destination, config) {
  if (typeof destination !== "string" || !destination.trim()) {
    return { refused: "say where to export to, e.g. `vowel export ../my-site`" }
  }
  const real = realAsFarAsItExists(path.resolve(destination))
  const source = realAsFarAsItExists(config.sourceFolder)
  const system = realAsFarAsItExists(systemDirectoryFor(config.sourceFolder))
  const output = realAsFarAsItExists(config.targetFolder)

  if (within(real, source)) {
    return { refused: `${destination} is inside the project (${source}); the next build would read the export as part of the site. Export somewhere outside it.` }
  }
  if (within(source, real)) {
    return { refused: `${destination} contains the project (${source}). Export to a folder of its own.` }
  }
  if (within(real, system) || within(real, output) || within(output, real)) {
    return { refused: `${destination} is where vowel keeps its own build (${system}). Export somewhere else.` }
  }
  return { path: real }
}

/**
 * @param {string} folder - real, absolute
 * @param {string} destination - as given, for the message
 * @returns {Promise<string | undefined>} why it can't be used, if it can't
 */
async function checkEmpty(folder, destination) {
  const info = await stat(folder).catch(() => undefined)
  if (!info) return undefined
  if (!info.isDirectory()) return `${destination} is a file, not a folder.`
  const entries = await readdir(folder)
  if (entries.length) return `${destination} isn't empty. Export to a new or empty folder.`
  return undefined
}

/**
 * @param {{ path?: string } | undefined} payload
 * @param {{ config: Votive.VotiveConfig, notify: (message: object) => void }} context
 */
async function exportSite(payload, { config, notify }) {
  const checked = checkDestination(payload?.path, config)
  if ("refused" in checked) throw new Error(`export: ${checked.refused}`)
  const notEmpty = await checkEmpty(checked.path, payload.path)
  if (notEmpty) throw new Error(`export: ${notEmpty}`)

  notify({ status: "progress", message: "Building..." })
  // As deploy does: everything finished, deferred work (image
  // derivatives, link previews) included, and the database closed.
  const site = await votive({ ...config, verbose: false })
  await (await site.build()).deferred
  await site.close()

  notify({ status: "progress", message: `Copying to ${checked.path}...` })
  await cp(config.targetFolder, checked.path, { recursive: true })
  const files = await readdir(checked.path, { recursive: true, withFileTypes: true })
  const count = files.filter(entry => entry.isFile()).length
  notify({ status: "done", message: `Exported ${count} files to ${checked.path}` })
  return { exported: checked.path, files: count }
}

/** @type {Votive.VotivePlugin} */
const vowelExportPlugin = {
  name: "vowel-export",
  commands: { export: exportSite }
}

export default vowelExportPlugin
export { exportSite, checkDestination, within }
