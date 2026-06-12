import { readFile } from "node:fs/promises"
/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
async function writeFile(destination, database, config) {
  const buffer = await readFile(destination.abstract.filePath)
  return {
    data: buffer,
  }
}

function readFont(filePath) {
  return {
    abstract: { filePath },
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
