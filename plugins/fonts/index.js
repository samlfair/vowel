import { readFile } from "node:fs/promises"
import path from "node:path"
import { resolveTheme } from "../styles/theme.js"
import { typographyCSS } from "../markdown/typography.js"
/** @import * as Votive from "votive" */

// Where vowel's own bundled families live (see plugins/markdown/fonts.js).
const BUNDLED_FONTS = path.join(import.meta.dirname, "..", "..", "fonts")

/**
 * The faces `stubs()` declared on the current pass. Read by `readFont` to
 * tell one of vowel's own faces from a font the project ships, without
 * touching the filesystem or seeing the stub's params.
 */
const declaredFaces = new Set()

/**
 * The faces of whichever family the theme selected.
 *
 * This is the case that motivated the whole design. These used to be
 * created with api.createTarget from the folder pass, and nothing
 * retracted a target whose creator stopped creating it - so switching
 * theme.font from Fraunces to Recursive left both families' rows *and*
 * their files behind, and no cleanup sweep could remove them, because the
 * database still claimed them. As stubs they stop being declared the
 * moment the font changes, and row and file go with them.
 *
 * @type {Votive.ProcessorStubs}
 */
function createStubs({ settings }) {
  const { config } = resolveTheme(settings.lastNonNull("theme"))
  const dynamicType = typographyCSS(config)

  declaredFaces.clear()
  if (!dynamicType) return []
  dynamicType.files.forEach(file => declaredFaces.add(file))

  // `bundled` is a name, not a path: writeFile resolves it against
  // vowel's own directory, so nothing machine-specific is ever stored.
  return dynamicType.files.map(file => ({ path: file, params: { bundled: file } }))
}

/**
 * Reads the bytes of a bundled face. A buffer-format stub, so this runs
 * as deferred work like any other buffer read.
 * @type {Votive.ProcessorExpand}
 */
async function expandStubs({ params }) {
  return { buffer: await readFile(path.join(BUNDLED_FONTS, params.bundled)) }
}

/** @type {Votive.ProcessorWrite} */
async function writeFile(target) {
  // A face vowel ships itself names a file from vowel's own bundle.
  // Resolved here rather than stored, for the same reason target.buffer()
  // resolves rather than stores: an absolute path in the database stops
  // being true the moment anything moves. Checked before `source`,
  // because a stub has a source path too - it just has no file behind it.
  if (target.metadata?.bundled) {
    return { data: await readFile(path.join(BUNDLED_FONTS, target.metadata.bundled)) }
  }

  // A font in the project is copied straight through from its own source
  // file - target.buffer() resolves that against sourceFolder at the
  // moment of reading, so nothing about this machine is ever stored.
  return { data: target.buffer() }
}

/** @type {Votive.ProcessorRead} */
function readFont(source) {
  // A project's own font records nothing: its bytes are reachable from
  // the target's `source` at write time. A bundled face records the name
  // writeFile resolves against vowel's own directory.
  //
  // A read hook never sees a stub's params - that is deliberate, so
  // readFile stays a parser - so "is this one of ours?" is answered by
  // asking what this processor declared. `stubs()` runs earlier in the
  // same pass and rewrites the set, and font reads are deferred, so the
  // set is always the current one by the time this runs. No filesystem
  // probing, and in particular no resolving a stored relative path
  // against cwd, which is never right (see CLAUDE.md on paths).
  if (declaredFaces.has(source.path)) return { metadata: { bundled: source.path } }
  return { metadata: {} }
}

/** @type {Votive.VotiveProcessor} */
const fontsReader = {
  format: "buffer",
  extensions: [".woff", ".woff2", ".ttf", ".otf"],
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  createStubs,
  expandStubs,
  readFile: readFont,
  writeFile
}

/** @type {Votive.VotivePlugin} */
const vowelFontsPlugin = {
  name: "vowel-fonts",
  processors: [fontsReader]
}

export default vowelFontsPlugin
