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
 * `type.css` is emitted only when the theme actually drives dynamic
 * typography, and it comes before `colors.css`/`default.css` because a
 * later `@layer` statement appends unseen layers to the end of the order.
 * @param {unknown} themeSetting
 * @returns {string[]}
 */
function themeStylesheets(themeSetting) {
  const { config, name, known } = resolveTheme(themeSetting)
  if (!known) return []

  const sheets = ["reset.css"]
  if (name === "reset") return sheets

  sheets.push("typography.css")
  if (typographyCSS(config)) sheets.push("type.css")
  if (name === "typography") return sheets

  return [...sheets, "colors.css", "default.css"]
}

export { resolveTheme, themeStylesheets, BUILT_IN_THEMES }
