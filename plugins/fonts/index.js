import { readFile } from "node:fs/promises"
import path from "node:path"
/** @import * as Votive from "votive" */

// Where vowel's own bundled families live (see plugins/markdown/fonts.js).
const BUNDLED_FONTS = path.join(import.meta.dirname, "..", "..", "fonts")

/** @type {Votive.ProcessorWrite} */
async function writeFile(target) {
  // A font in the project is copied straight through from its own source
  // file - target.buffer() resolves that against sourceFolder at the
  // moment of reading, so nothing about this machine is ever stored.
  if (target.source) return { data: target.buffer() }

  // A font vowel ships itself (see plugins/markdown/typography.js) has no
  // source inside the project, so it names a file from vowel's own
  // bundle. Resolved here rather than stored, for the same reason
  // target.buffer() resolves rather than stores: an absolute path in the
  // database stops being true the moment anything moves.
  return { data: await readFile(path.join(BUNDLED_FONTS, target.abstract.bundled)) }
}

/** @type {Votive.ProcessorRead} */
function readFont() {
  // Nothing to record: the bytes are reachable from the target's own
  // `source` at write time.
  return {
    abstract: {},
    metadata: {}
  }
}

/** @type {Votive.VotiveProcessor} */
const fontsReader = {
  format: "buffer",
  extensions: [".woff", ".woff2", ".ttf", ".otf"],
  readFile: readFont,
  writeFile
}

/** @type {Votive.VotivePlugin} */
const vowelFontsPlugin = {
  name: "vowel-fonts",
  processors: [fontsReader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelFontsPlugin
