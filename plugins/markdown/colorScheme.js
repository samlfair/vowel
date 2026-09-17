import { getScheme } from "colorhorse"
import { fallbackColors } from "./brandColors.js"

/**
 * The stylesheets index shades 00-11 - DefaultStyles.css reads
 * `--<role>-00` through `--<role>-11` - so the scheme is generated at 12
 * shades rather than colorhorse's default 10. tests/colorScheme.js is
 * the statement of that contract.
 */
const shadeCount = 10

/**
 * colorhorse orders each role's ramp darkest-first, and vowel's
 * stylesheets read shade 00 as the *lightest* - DefaultStyles.css has
 * `--main-background: light-dark(var(--primary-00), var(--primary-11))`,
 * so 00 is the light-mode background. Reversed here, once, rather than
 * at each use.
 * @param {string[]} ramp
 */
function lightestFirst(ramp) {
  return [...ramp].reverse()
}

/** @param {number} index */
function shadeName(index) {
  return String(index).padStart(2, "0")
}

/**
 * Vowel's own brand colors, used by any default-theme site that hasn't
 * chosen its own pair. colorhorse ships a built-in default too; naming
 * ours here means an un-themed blog looks like Vowel rather than like
 * the library, and means `--<role>-NN` is always defined - DefaultStyles.css
 * consumes those variables unconditionally.
 */

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
