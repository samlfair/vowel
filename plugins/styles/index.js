import path from "node:path"
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
function readCSS(text, filePath, targetPath, api, config) {
  const metadata = {}
  const abstract = {
    css: text
  }

  return {
    metadata,
    abstract,
    // filePath is the absolute source path (see readSources.js's plugin
    // contract) - html/index.js's `href: /${sheet}` build expects a
    // sourceFolder-relative, routable reference instead (matching the
    // bare "reset.css"/"typography.css" built-ins below in
    // markdown/index.js), or it renders a broken `//absolute/fs/path`
    // href (a protocol-relative URL the browser tries to fetch from a
    // host named "workspaces", not a real stylesheet - found via a real
    // build, not by inspection).
    settings: { stylesheets: [path.relative(config.sourceFolder, filePath)] }
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
