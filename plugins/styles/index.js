import path from "node:path"
import { readFileSync } from "node:fs"
import { styleText } from "node:util"
import { transform } from "lightningcss"
import { hash } from "node:crypto"
import { resolveTheme, themeStylesheets, themeKey } from "./theme.js"
import { themeColorSchemeCSS } from "../markdown/colorScheme.js"
import { typographyCSS } from "../markdown/typography.js"

/** @import * as Votive from "votive" */

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

/** Vowel's own bundled stylesheets, by target path. */
const BUNDLED = {
  "reset.css": "ResetStyles.css",
  "typography.css": "TypographyStyles.css",
  "default.css": "DefaultStyles.css",
  "syntax-highlighting.css": "SyntaxHighlightingStyles.css"
}

/**
 * The stylesheets vowel generates, as stubs.
 *
 * These used to be created from the markdown plugin's readFolder, which
 * reran for every folder on every pass and re-created each sheet with its
 * raw text - fighting the write pass, which stores back the minified
 * output. That flip is what made every page's cache-buster change twice a
 * build (see tasks/3-in-review/stylesheet-data-flip-flop.md). A stub is
 * expanded only when its params change, so nothing re-creates them and
 * `data` settles.
 *
 * A bundled sheet carries no params: its content is part of the software,
 * not the project. That means a warm database never re-reads it, which is
 * fine while the CLI wipes on every launch and is why the version stamp
 * in tasks/1-proposed/post-stubs-vowel-followups.md is parked rather than
 * forgotten.
 *
 * @type {Votive.ProcessorStubs}
 */
function createStubs({ api, settings }) {
  // Every theme any folder declares, plus the root's resolved one (which
  // is the default when nothing declares it), one set of generated sheets
  // each. The `settings` handed here is the root's view; settingValues
  // is how the enumerator sees what subfolders declared.
  const rootTheme = settings.lastNonNull("theme")
  const declared = api.settingValues("theme")
  const themes = [rootTheme, ...declared].filter((theme, index, all) => (
    all.findIndex(other => themeKey(other) === themeKey(theme)) === index
  ))

  const sheets = themes.flatMap(theme => {
    const { config } = resolveTheme(theme)
    return themeStylesheets(theme, rootTheme).map(sheet => {
      // Generated sheets carry the part of the theme they are generated
      // from, so they re-expand exactly when that part changes.
      if (sheet.startsWith("colors")) return { path: sheet, params: { colors: config.colors ?? null } }
      if (sheet.startsWith("type")) return { path: sheet, params: { theme: config } }
      return { path: sheet }
    })
  }).filter((sheet, index, all) => all.findIndex(other => other.path === sheet.path) === index)

  // Always declared, unlike the rest: it was created from the html
  // writeFile the first time a page happened to contain a code block,
  // which made its existence depend on the order pages were written in.
  // Pages still link it only when they have code.
  return [...sheets, { path: "syntax-highlighting.css" }]
}

/**
 * @type {Votive.ProcessorExpand}
 */
function expandStubs({ path: sourcePath, params }) {
  const bundled = BUNDLED[sourcePath]
  if (bundled) {
    return { text: readFileSync(path.join(VOWEL_DIR, "stylesheets", bundled), "utf-8") }
  }

  if (/^colors(-[0-9a-f]{8})?\.css$/.test(sourcePath)) {
    // Reports and falls back rather than throwing: a site with unusable
    // colours should lose its palette, not its build.
    return {
      text: themeColorSchemeCSS(params?.colors, error => (
        console.warn(`${styleText("dim", "build: ")}${styleText("yellow", `ignoring theme.colors - ${error.message}`)}`)
      ))
    }
  }

  if (/^type(-[0-9a-f]{8})?\.css$/.test(sourcePath)) {
    return { text: typographyCSS(params?.theme)?.css ?? "" }
  }

  return null
}

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
  createStubs,
  expandStubs,
  readFile: readCSS,
  writeFile: writeCSS
}

/** @type {Votive.VotivePlugin} */
const vowelStylesPlugin = {
  name: "vowel-styles",
  processors: [cssWriter]
}

export default vowelStylesPlugin
