import { transform } from "lightningcss"

/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
function writeCSS(target, settings, api, config) {
  const { code, map } = transform({
    filename: target.path,
    code: Buffer.from(target.abstract.css),
    minify: true,
    targets: {
      chrome: 140 << 16,
      firefox: 140 << 16,
      safari: 20 << 16
    }
  })

  const processedCSS = code.toString()

  return {
    data: processedCSS,
    encoding: "utf-8"
  }
}



/** @type {Votive.ReadText} */
function readCSS(text, filePath, targetPath, settings, api, config) {
  const metadata = {}
  const abstract = {
    css: text
  }

  return {
    metadata,
    abstract,
    settings: { stylesheets: [filePath] }
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
