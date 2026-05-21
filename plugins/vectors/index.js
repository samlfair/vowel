import fs from "fs/promises"
/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
async function writeFile(target) {
  return {
    data: target.abstract.svg
  }
}



/** @type {Votive.VotiveProcessor} */
const processor = {
  extensions: [".svg"],
  format: "text",
  readFile: (text, filePath, destinationPath, database) => {
    const monochrome = text.includes("currentColor") || Boolean(text.match(/#000\b/))
    return {
      abstract: { svg: text },
      metadata: { monochrome }
    }
  },
  writeFile
}

/** @type {Votive.VotivePlugin} */
const plugin = {
  name: "vowel-vectors",
  processors: [processor],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default plugin
