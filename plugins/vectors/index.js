import fs from "fs/promises"
/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
async function writeFile(target) {
  return {
    data: target.data
  }
}



/** @type {Votive.VotiveProcessor} */
const processor = {
  extensions: [".svg"],
  format: "text",
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: ({ text }) => {
    const monochrome = text.includes("currentColor") || Boolean(text.match(/#000\b/))
    return {
      data: text,
      metadata: { monochrome }
    }
  },
  writeFile
}

/** @type {Votive.VotivePlugin} */
const plugin = {
  name: "vowel-vectors",
  processors: [processor]
}

export default plugin
