/** @import * as Votive from "votive" */

/**
 * A font the project ships is copied straight through: target.buffer()
 * resolves the source against sourceFolder at the moment of reading, so
 * nothing about this machine is ever stored. The @font-face that uses
 * it is the author's, in their own stylesheet.
 *
 * Vowel bundles no fonts of its own any more - the families and their
 * stubs went with the typography ramps into TypographyStyles.css, which
 * names a brand family through --font-*-brand and falls back to the
 * system stack. Fonts by url: tasks/2-in-progress/load-fonts.md.
 * @type {Votive.ProcessorWrite}
 */
function writeFile(target) {
  return { data: target.buffer() }
}

/** @type {Votive.VotiveProcessor} */
const fontsReader = {
  format: "buffer",
  extensions: [".woff", ".woff2", ".ttf", ".otf"],
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  // A font carries no metadata worth inferring.
  readFile: () => ({ metadata: {} }),
  writeFile
}

/** @type {Votive.VotivePlugin} */
const vowelFontsPlugin = {
  name: "vowel-fonts",
  processors: [fontsReader]
}

export default vowelFontsPlugin
