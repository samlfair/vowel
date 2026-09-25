import { getScheme } from "colorhorse"
import { fallbackColors } from "./brandColors.js"

/**
 * Ten shades per role, named `01` (darkest) to `10` (lightest) in
 * colorhorse's own darkest-first order. DefaultStyles.css reads them
 * that way round: `light-dark(var(--primary-10), var(--primary-01))`
 * is the body background. tests/colorScheme.js pins the order.
 */
const shadeCount = 10

/** @param {number} index */
function shadeName(index) {
  return String(index).padStart(2, "0")
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
 * @returns {string}
 */
function colorSchemeCSS(colors) {
  if (colors === undefined || colors === null) return colorSchemeCSS(fallbackColors)

  if (!Array.isArray(colors) || colors.length !== 2) {
    throw new Error(`theme.colors must be an array of two "#rrggbb" colors, got ${JSON.stringify(colors)}`)
  }

  const [colorOne, colorTwo] = colors
  const scheme = getScheme(colorOne, colorTwo, { shadeCount, minLightness: 0.3, maxLightness: 0.99, minChroma: 0.2 })

  const declarations = Object.entries(scheme).flatMap(([role, ramp]) => (
    ramp.map((color, index) => `  --${role}-${shadeName(index + 1)}: ${color};`)
  ))

  return `:root {\n${declarations.join("\n")}\n}\n`
}

/**
 * The build-facing entry point: always returns a usable `:root` block.
 * Invalid configuration is reported through `onError` and then falls
 * back to the brand colors, so a typo in settings.md leaves the site
 * styled instead of stripping every color variable out from under
 * DefaultStyles.css.
 * @param {unknown} colors
 * @param {(error: Error) => void} onError
 * @returns {string}
 */
function themeColorSchemeCSS(colors, onError) {
  try {
    return colorSchemeCSS(colors)
  } catch (error) {
    onError(error)
    return colorSchemeCSS(fallbackColors)
  }
}

export { colorSchemeCSS, themeColorSchemeCSS, fallbackColors }
