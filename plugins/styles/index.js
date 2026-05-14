import postcss from "postcss"
import cssnano from "cssnano"
import autoprefixer from "autoprefixer"
import path from "node:path"

/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
function writeCSS(destination, database, config) {
  // const processedCSS = postcss([cssnano, autoprefixer])
  //   .process(destination.abstract.css)

  return {
    data: destination.abstract.css,
    encoding: "utf-8"
  }
}



/** @type {Votive.ReadText} */
function readCSS(text, filePath, destinationPath, database, config) {
  const pathInfo = path.parse(filePath)

  database.setting.create(
    pathInfo.dir,
    "stylesheets",
    filePath
  )

  const metadata = {}
  const abstract = {
    css: text
  }

  return {
    metadata,
    abstract
  }
}

/** @type {Votive.VotiveProcessor} */
const cssWriter = {
  extensions: [".css"],
  format: "text",
  readFile: readCSS,
  writeFile: writeCSS
}

/** @type {Votive.VotivePlugin} */
const vowelStylesPlugin = {
  name: "vowel-styles",
  processors: [cssWriter],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelStylesPlugin
