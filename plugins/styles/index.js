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



/** @type {Votive.ProcessorRead} */
function readCSS(source) {
  const metadata = {}
  const abstract = {
    css: source.text
  }

  return {
    metadata,
    abstract,
    // Already project-relative, which is exactly the routable reference
    // html/index.js's `href: /${sheet}` build wants (matching the bare
    // "reset.css"/"typography.css" built-ins in markdown/index.js).
    settings: { stylesheets: [source.path] }
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
