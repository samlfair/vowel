// theme typography settings -> the variables TypographyStyles.css reads.
//
// The ramps live in the stylesheet: it declares the input variables with
// their defaults and computes h1..h6 from them with pow(). This module
// knows one thing - which settings.md key sets which of those variables -
// and emits only the ones the author set, into the same `typography`
// layer, loaded after the sheet so they win by source order. The
// settings panel imports the same table to write the same variables on
// the document for live preview, so preview and build cannot disagree.
//
// No bundled fonts. `font`, `serif-font` and `monospace-font` name a
// family; the sheet's stacks put a system fallback after it, and an
// author who wants a web font ships it in the project with an
// @font-face in their own stylesheet (fonts by url is
// tasks/2-in-progress/load-fonts.md). Free of node builtins.

/**
 * @typedef {object} TypographySetting
 * @property {string} key - the settings.md key under `theme`
 * @property {string} variable - the custom property in TypographyStyles.css
 * @property {string} label
 * @property {string} [hint]
 * @property {"x" | "ch" | ""} unit - "x" is a multiple of --font-size-root
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {number} default - the sheet's own value, for the panel's slider
 */

/** @type {TypographySetting[]} */
export const rampSettings = [
  { key: "heading-size", variable: "--font-size-delta", label: "Heading size", hint: "How much larger h1 is than body text", unit: "x", min: 0.25, max: 4, step: 0.05, default: 2 },
  { key: "heading-size-decay", variable: "--font-size-decay", label: "Size decay", hint: "Higher makes subheadings smaller", unit: "", min: 0.5, max: 6, step: 0.1, default: 3 },
  { key: "h1-letter-spacing", variable: "--letter-spacing-h1", label: "h1 letter spacing", unit: "ch", min: -0.1, max: 0.1, step: 0.005, default: -0.01 },
  { key: "h6-letter-spacing", variable: "--letter-spacing-h6", label: "h6 letter spacing", unit: "ch", min: -0.1, max: 0.1, step: 0.005, default: 0 },
  { key: "letter-spacing-decay", variable: "--letter-spacing-decay", label: "Spacing decay", unit: "", min: 0.5, max: 6, step: 0.1, default: 2 },
  { key: "h1-weight", variable: "--font-weight-h1", label: "h1 weight", unit: "", min: 100, max: 900, step: 10, default: 800 },
  { key: "h6-weight", variable: "--font-weight-h6", label: "h6 weight", unit: "", min: 100, max: 900, step: 10, default: 600 },
  { key: "weight-decay", variable: "--font-weight-decay", label: "Weight decay", unit: "", min: 0.5, max: 6, step: 0.1, default: 2 }
]

/** @type {{key: string, variable: string, label: string, hint: string}[]} */
export const fontSettings = [
  { key: "font", variable: "--font-sans-brand", label: "Font", hint: "Body and headings; a family the browser has or the site ships" },
  { key: "serif-font", variable: "--font-serif-brand", label: "Serif font", hint: "Where the theme uses a serif" },
  { key: "monospace-font", variable: "--font-monospace-brand", label: "Monospace font", hint: "Code" }
]

/**
 * The `theme` mapping, or {} for a bare theme name.
 * @param {unknown} theme
 * @returns {Record<string, unknown>}
 */
function themeSettings(theme) {
  return theme && typeof theme === "object" && !Array.isArray(theme) ? /** @type {Record<string, unknown>} */ (theme) : {}
}

/**
 * A ramp setting's value as CSS, clamped to its range. "x" is a multiple
 * of the root size, so headings follow the root's clamp() up and down.
 * @param {TypographySetting} setting
 * @param {number} value
 */
function rampValue(setting, value) {
  const clamped = Math.min(setting.max, Math.max(setting.min, value))
  const number = String(Number(clamped.toFixed(4)))
  if (setting.unit === "x") return `calc(${number} * var(--font-size-root))`
  return `${number}${setting.unit}`
}

/**
 * A family name as a font-family value: quoted, unless the author wrote
 * a stack or quoted it themselves.
 * @param {string} name
 */
function fontValue(name) {
  const trimmed = name.trim()
  return /[,"']/.test(trimmed) ? trimmed : `"${trimmed}"`
}

/**
 * Every variable the theme sets, as [name, value] pairs - only the keys
 * the author wrote, so the sheet's defaults stand for the rest. What
 * the build emits and what the panel writes to the document.
 * @param {unknown} theme
 * @returns {[string, string][]}
 */
export function typographyVariables(theme) {
  const settings = themeSettings(theme)
  const pairs = []

  for (const setting of rampSettings) {
    const raw = settings[setting.key]
    const value = typeof raw === "number" ? raw : Number(raw)
    if (raw === undefined || raw === null || raw === "" || !Number.isFinite(value)) continue
    pairs.push([setting.variable, rampValue(setting, value)])
  }

  for (const setting of fontSettings) {
    const raw = settings[setting.key]
    if (typeof raw !== "string" || !raw.trim()) continue
    pairs.push([setting.variable, fontValue(raw)])
  }

  return pairs
}

/**
 * The stylesheet for a theme's typography settings, or null when it
 * sets none - the site then keeps whatever TypographyStyles.css gives
 * it and no type.css is declared.
 * @param {unknown} theme
 * @returns {{css: string} | null}
 */
export function typographyCSS(theme) {
  const variables = typographyVariables(theme)
  if (!variables.length) return null

  const css = [
    `/* Generated from theme settings in settings.md - edit the settings, not this file. */`,
    `@layer reset, typography;`,
    ``,
    `@layer typography {`,
    `  :root {`,
    ...variables.map(([name, value]) => `    ${name}: ${value};`),
    `  }`,
    `}`,
    ``
  ].join("\n")

  return { css }
}
