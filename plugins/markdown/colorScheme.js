import { getScheme } from "colorhorse"
import { fallbackColors } from "./brandColors.js"

/**
 * Ten shades per role, named `01` (darkest) to `10` (lightest) in
 * colorhorse's own darkest-first order. DefaultStyles.css reads them
 * that way round: `light-dark(var(--color-primary-10), var(--color-primary-01))`
 * is the body background. tests/colorScheme.js pins the order.
 */
const shadeCount = 10

/**
 * The `theme` keys that tune the scheme, each one colorhorse option, all
 * numbers from 0 to 1. The defaults are vowel's, set before these were
 * settings; `contrast` 0 is colorhorse's, evenly spread shades.
 */
const schemeSettings = [
  { key: "darkest-shade", option: "minLightness", default: 0.3 },
  { key: "lightest-shade", option: "maxLightness", default: 0.99 },
  { key: "min-saturation", option: "minChroma", default: 0.2 },
  { key: "contrast", option: "contrast", default: 0 }
]

const defaultOptions = Object.fromEntries(schemeSettings.map(setting => [setting.option, setting.default]))

/** @param {number} index */
function shadeName(index) {
  return String(index).padStart(2, "0")
}

/** @param {unknown} value */
function isFraction(value) {
  return typeof value === "number" && value >= 0 && value <= 1
}

/**
 * The part of a theme the colors sheet is generated from, as stub
 * params: the sheet re-expands when one of these changes, and only then.
 * @param {Record<string, unknown>} theme - a resolved theme's config
 */
function colorParams(theme) {
  const settings = schemeSettings.map(setting => [setting.key, theme[setting.key] ?? null])
  return { colors: theme.colors ?? null, ...Object.fromEntries(settings) }
}

/**
 * colorhorse's options from a theme's settings. A value that is not a
 * number from 0 to 1 is reported and left at its default, rather than
 * costing the site its colors: colorhorse throws for `contrast` alone,
 * and turns the rest into ramps nobody asked for.
 * @param {Record<string, unknown>} theme
 * @param {(error: Error) => void} onError
 */
function schemeOptions(theme, onError) {
  const entries = schemeSettings.map(setting => {
    const value = theme[setting.key]
    if (value === undefined || value === null) return [setting.option, setting.default]
    if (isFraction(value)) return [setting.option, value]
    onError(new Error(`ignoring theme.${setting.key} - expected a number from 0 to 1, got ${JSON.stringify(value)}`))
    return [setting.option, setting.default]
  })
  const options = Object.fromEntries(entries)

  // Reversed, colorhorse still answers, with a ramp whose "darkest"
  // shade is the lighter one.
  if (options.minLightness < options.maxLightness) return options
  onError(new Error(`ignoring theme.darkest-shade and theme.lightest-shade - the darkest shade (${options.minLightness}) must be below the lightest (${options.maxLightness})`))
  return { ...options, minLightness: defaultOptions.minLightness, maxLightness: defaultOptions.maxLightness }
}

/**
 * Builds the `:root` block for a theme's `colors` seed pair, falling
 * back to Vowel's brand colors when a site hasn't configured any.
 *
 * Colors that *are* configured but unusable throw, so the author is told
 * rather than left wondering why theirs did nothing; colorhorse's own
 * messages are specific ("colorOne has a chroma of zero...") and are
 * left to surface as they are.
 * @param {unknown} colors - a theme setting's `colors`
 * @param {object} [options] - colorhorse's, already checked (schemeOptions)
 * @returns {string}
 */
function colorSchemeCSS(colors, options = defaultOptions) {
  if (colors === undefined || colors === null) return colorSchemeCSS(fallbackColors, options)

  if (!Array.isArray(colors) || colors.length !== 2) {
    throw new Error(`theme.colors must be an array of two "#rrggbb" colors, got ${JSON.stringify(colors)}`)
  }

  const [colorOne, colorTwo] = colors
  const scheme = getScheme(colorOne, colorTwo, { ...options, shadeCount })

  const declarations = Object.entries(scheme).flatMap(([role, ramp]) => (
    ramp.map((color, index) => `  --color-${role}-${shadeName(index + 1)}: ${color};`)
  ))

  return `:root {\n${declarations.join("\n")}\n}\n`
}

/**
 * The build-facing entry point: always returns a usable `:root` block.
 * Invalid configuration is reported through `onError` and then falls
 * back - unusable colors to the brand colors, a bad setting to its
 * default - so a typo in settings.md leaves the site styled instead of
 * stripping every color variable out from under DefaultStyles.css.
 * @param {Record<string, unknown>} theme - colorParams' shape
 * @param {(error: Error) => void} onError
 * @returns {string}
 */
function themeColorSchemeCSS(theme, onError) {
  const options = schemeOptions(theme, onError)
  try {
    return colorSchemeCSS(theme.colors, options)
  } catch (error) {
    onError(new Error(`ignoring theme.colors - ${error.message}`))
    return colorSchemeCSS(fallbackColors, options)
  }
}

export { colorSchemeCSS, themeColorSchemeCSS, colorParams, fallbackColors }
