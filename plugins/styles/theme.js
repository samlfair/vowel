import { hash } from "node:crypto"
import { typographyCSS } from "../markdown/typography.js"

/**
 * The themes vowel ships. A `theme` naming anything else gets no
 * stylesheets at all, which is the behaviour the folder pass had.
 */
const BUILT_IN_THEMES = ["reset", "typography", "default"]

/**
 * A `theme` setting is either a bare name ("default") or an object
 * carrying its own configuration ({name: "Default", colors: [...]}) -
 * which is what `theme.colors` means as a path. Compared
 * case-insensitively: settings.md is written by hand, and "Default" is
 * what a person would type.
 * @param {unknown} themeSetting
 */
function resolveTheme(themeSetting) {
  const isConfig = themeSetting && typeof themeSetting === "object" && !Array.isArray(themeSetting)
  const config = isConfig ? themeSetting : { name: themeSetting }
  const name = config.name ? String(config.name).toLowerCase() : "default"
  return { config, name, known: BUILT_IN_THEMES.includes(name) }
}

/**
 * A short, stable identity for a theme configuration: its canonical
 * JSON (keys sorted at every depth), hashed. Two settings.md files that
 * spell the same theme get the same key, and the same generated sheets.
 * @param {unknown} themeSetting
 */
function themeKey(themeSetting) {
  const { config, name } = resolveTheme(themeSetting)
  return hash("MD5", canonical({ ...config, name })).slice(0, 8)
}

/** @param {unknown} value */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`
  }
  return JSON.stringify(value)
}

/** The generated sheets, the ones a theme's configuration decides. */
const GENERATED = /^(colors|type)(-[0-9a-f]{8})?\.css$/

/** The bundled sheets, part of the software rather than the project. */
const BUNDLED_SHEETS = ["reset.css", "typography.css", "default.css", "syntax-highlighting.css"]

/**
 * The theme's stylesheets, in cascade order.
 *
 * **The single source of truth for two questions that must agree**: which
 * sheets the styles processor declares as stubs, and which sheets a page
 * links. They used to be one list built in the folder pass and written to
 * a `stylesheets` setting that the html plugin read back; the list and the
 * targets were produced by the same block, so they could not disagree.
 * Now that the targets are stubs, this function is what keeps them in
 * step - a sheet that is declared is linked, and nothing links a sheet
 * that was never declared.
 *
 * A theme is a folder setting, so a folder can have its own - and the
 * generated sheets (`colors.css`, `type.css`) are what differ between
 * two themes; the bundled ones are shared. The root's theme keeps the
 * plain names; any other theme's generated sheets carry the theme's
 * key (`colors-3f9a2c1d.css`), so folders sharing a theme share a file
 * and nothing is written twice.
 *
 * `type.css` is emitted only when the theme actually drives dynamic
 * typography, and it comes before `colors.css`/`default.css` because a
 * later `@layer` statement appends unseen layers to the end of the order.
 *
 * Every built-in is named here, `default` included: an undefined theme
 * *is* the default theme, and a folder with none declared inherits
 * whatever its nearest ancestor declared - `reset` at the root means
 * `reset` below it, not `default`.
 * @param {unknown} themeSetting - this folder's resolved theme
 * @param {unknown} [rootThemeSetting] - the root's; omitted means "this
 *   is the root's". A rest parameter rather than a default, because an
 *   undeclared root theme is a real `undefined` that must not collapse
 *   into "same as this one".
 * @returns {string[]}
 */
function themeStylesheets(themeSetting, ...root) {
  const rootThemeSetting = root.length ? root[0] : themeSetting
  const { config, name, known } = resolveTheme(themeSetting)
  if (!known) return []

  const key = themeKey(themeSetting)
  const suffix = key === themeKey(rootThemeSetting) ? "" : `-${key}`
  const generated = (sheet) => `${sheet}${suffix}.css`

  switch (name) {
    case "reset":
      return ["reset.css"]
    case "typography":
      return ["reset.css", "typography.css", ...(typographyCSS(config) ? [generated("type")] : [])]
    case "default":
      return ["reset.css", "typography.css", ...(typographyCSS(config) ? [generated("type")] : []), generated("colors"), "default.css"]
    default:
      return []
  }
}

/**
 * Whether a stylesheet path is vowel's - bundled, or generated from a
 * theme - as opposed to the project's own. Every one of them is a stub
 * with a source path like any other source, so this is the test that
 * separates them.
 */
function isVowelStylesheet(sheetPath) {
  return BUNDLED_SHEETS.includes(sheetPath) || GENERATED.test(sheetPath)
}

export { resolveTheme, themeStylesheets, themeKey, isVowelStylesheet, BUNDLED_SHEETS, BUILT_IN_THEMES }
