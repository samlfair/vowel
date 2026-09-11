import { transform } from "lightningcss"
import { hash } from "node:crypto"

/** @import * as Votive from "votive" */

/** @type {Votive.ProcessorWrite} */
function writeCSS(target, { config }) {
  const { code, map } = transform({
    filename: target.path,
    code: Buffer.from(target.data ?? ""),
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
  return {
    metadata: { hash: hash("MD5", source.text).slice(0, 8) },
    // The CSS itself is the target's content. After the first write pass
    // `data` holds the minified output instead - transform() is idempotent
    // over its own output, so a later rewrite produces the same bytes.
    data: source.text,
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
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: readCSS,
  writeFile: writeCSS
}

/** @type {Votive.VotivePlugin} */
const vowelStylesPlugin = {
  name: "vowel-styles",
  processors: [cssWriter]
}

export default vowelStylesPlugin
