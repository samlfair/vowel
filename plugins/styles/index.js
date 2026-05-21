import path from "node:path"
import { transform } from "lightningcss"

/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
function writeCSS(destination, database, config) {
  const { code, map } = transform({
    filename: destination.path,
    code: Buffer.from(destination.abstract.css),
    minify: true,
    targets: {
      chrome: 146 << 16,
      firefox: 149 << 16,
      safari: 26 << 16
    }
  })

  const processedCSS = code.toString()

  return {
    data: processedCSS,
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
