import fs from "fs/promises"

/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
async function writeImage(destination, database, config) {
  const buffer = await fs.readFile(destination.path)
  return {
    data: buffer,
  }
}

/** @type {Votive.ProcessorRead} */
function readImagePath(string) {

  const data = {
    metadata: {},
    abstract: {
      path: string
    }
  }

  return data
}

/** @type {Votive.VotiveProcessor} */
const jpegLoader = {
  format: "buffer",
  extensions: [".jpeg", ".jpg", ".png", ".webp", ".gif"],
  readFile: readImagePath,
  writeFile: writeImage
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-jpeg",
  processors: [jpegLoader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelImagesPlugin
