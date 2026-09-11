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
    //
    // No `settings` contribution. "Which stylesheets apply to a folder"
    // is a listing, not a setting: the html plugin asks api.targets()
    // for the .css targets in each of a page's ancestor folders. This
    // used to push `stylesheets: [source.path]` into the same label the
    // theme's built-ins are written under, which is what needed a
    // multi-writer accumulator behind every settings row.
    data: source.text
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
