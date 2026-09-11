// theme.font and its companions -> one stylesheet.
//
// The heading scale is computed in CSS rather than here, with pow() over
// six steps (the model in typography/styles.css). That is what lets the
// settings panel preview a change by setting one custom property and
// nothing else: the whole ramp recomputes, and preview and build agree
// by construction because they are the same arithmetic.
//
// Emitted into its own cascade layer, after typography, so it overrides
// TypographyStyles.css without either file knowing about the other.

import { families, findFamily, findTextFamily, rampValues, fixedValue, numericValue, RAMP } from "./fonts.js"

// 16px on a small screen, 18px on a large one.
const BASE_FONT_SIZE = "clamp(1rem, 0.875rem + 0.333vw, 1.125rem)"

const LEVELS = [1, 2, 3, 4, 5, 6]
const STEPS = 6

// Ids, not classes: there is exactly one of each on a page (see
// plugins/html/index.js, which emits a#title and p#tagline).
const HEADER_TITLE = "header #title"
const HEADER_TAGLINE = "header #tagline"

/**
 * One heading level's share of an axis, as the CSS that computes it.
 * Level 1 (h1) sits at the far end of the ramp, level 6 at the near end,
 * matching the 1/6..6/6 progression the model uses.
 * @param {string} variable
 * @param {number} level
 */
function rampValue(variable, level) {
  const step = STEPS + 1 - level
  return `calc(var(--${variable}-start) + calc(var(--${variable}-delta) * pow(calc(${step} / ${STEPS}), var(--${variable}-power))))`
}

/** @param {number} value */
function number(value) {
  // Trailing zeroes read as noise in a generated file that people will
  // open and look at.
  return String(Number(value.toFixed(4)))
}

/**
 * The start/end/delta/power block one ramped axis needs. `start` is the
 * h6 end and `end` the h1 end, so a ramp always runs small to large in
 * the same direction the pow() curve does.
 * @param {{variable: string, unit: string, h1: any, h6: any, power: any}} axis
 * @param {Record<string, unknown>} settings
 */
function rampVariables(axis, settings) {
  const { h1, h6, power } = rampValues(axis, settings)

  // A size is a multiple of the body text, not an absolute length, so it
  // follows --base-font-size up and down the clamp() with everything
  // else. Every other axis is in its own units already.
  const value = amount => axis.unit === "x"
    ? `calc(var(--base-font-size) * ${number(amount)})`
    : `${number(amount)}${axis.unit}`

  return [
    `--${axis.variable}-start: ${value(h6)};`,
    `--${axis.variable}-end: ${value(h1)};`,
    `--${axis.variable}-delta: calc(var(--${axis.variable}-end) - var(--${axis.variable}-start));`,
    `--${axis.variable}-power: ${number(power)};`
  ]
}

/**
 * The src for one face. woff2 is already the format browsers want; the
 * ttfs are shipped as they came, which costs bytes but keeps this from
 * needing a font compiler at build time.
 * @param {{file: string}} face
 */
function faceFormat(face) {
  return face.file.endsWith(".woff2") ? "woff2" : "truetype"
}

/**
 * @param {{cssName: string, faces: {file: string, style: string}[], axes: any[]}} family
 */
function fontFaces(family) {
  const weight = family.axes.find(axis => axis.id === "weight")
  const range = weight ? `${weight.h1.min} ${weight.h1.max}` : "100 900"

  return family.faces.map(face => [
    `@font-face {`,
    `  font-family: "${family.cssName}";`,
    `  src: url("/${face.file}") format("${faceFormat(face)}");`,
    `  font-weight: ${range};`,
    `  font-style: ${face.style};`,
    `  font-display: swap;`,
    `}`
  ].join("\n"))
}

/**
 * Builds the stylesheet for a configured family.
 *
 * Only the selected family is described: its faces, its axes, and
 * nothing about the other seven. A site that picks Fraunces should not
 * ship a byte about Recursive.
 *
 * @param {{name?: unknown} & Record<string, unknown>} theme the `theme`
 *   mapping from settings.md, or a bare theme name (no typography).
 * @returns {{css: string, files: string[]} | null} null when no font is
 *   configured - the site keeps whatever TypographyStyles.css gives it.
 */
export function typographyCSS(theme) {
  const settings = theme && typeof theme === "object" && !Array.isArray(theme) ? theme : {}
  const family = findFamily(settings.font)
  const bodyFamily = findTextFamily(settings["body-font"])

  if (!family && !bodyFamily) return null
  if (!family) return bodyOnlyCSS(bodyFamily, settings)

  const ramped = family.axes.filter(axis => axis.kind === RAMP)
  const fixed = family.axes.filter(axis => axis.kind !== RAMP)

  const variables = ramped.flatMap(axis => rampVariables(axis, settings))

  // The six steps, resolved once in :root. Every rule that wants a level
  // is then a var() reference rather than another copy of the
  // arithmetic - which is what lets the site title and tagline below sit
  // on the same ramp as the headings for free.
  const steps = ramped.flatMap(axis => LEVELS.map(level => (
    `--${axis.variable}${level}: ${rampValue(axis.variable, level)};`
  )))

  // Held apart from the ramp variables: these are what the panel writes
  // to preview a change, and they read better grouped.
  const fixedSettings = fixed.map(axis => (
    `"${axis.tag}" ${number(fixedValue(axis, settings))}`
  ))

  /**
   * One element typeset at one step of the ramp.
   * @param {string} selector
   * @param {number} level
   */
  function levelRule(selector, level) {
    const declarations = ramped.flatMap(axis => (
      axis.property ? [`  ${axis.property}: var(--${axis.variable}${level});`] : []
    ))

    // Every axis without a high-level property of its own goes here.
    // wght and opsz are deliberately never listed: naming an axis in
    // font-variation-settings overrides the high-level property for it,
    // which would freeze optical sizing and break font-weight.
    const variations = ramped
      .filter(axis => !axis.property)
      .map(axis => `"${axis.tag}" var(--${axis.variable}${level})`)
      .concat(fixedSettings)

    if (variations.length) {
      declarations.push(`  font-variation-settings: ${variations.join(", ")};`)
    }

    return [`${selector} {`, ...declarations, `}`].join("\n")
  }

  const headingRules = LEVELS.map(level => levelRule(`h${level}`, level))

  // The site title and tagline are the page's other display type, and
  // were the last things still typeset by TypographyStyles.css's fixed
  // 2.8em/2.5em. They take steps of the same ramp rather than settings
  // of their own: one scale for everything, and tuning it moves the
  // header with the headings instead of leaving it behind.
  //
  // Only type properties are set here. #tagline's display is owned by
  // the default theme, which hides it in the header and shows it as the
  // homepage hero - not something a typography sheet should touch.
  const headerRules = [
    levelRule(HEADER_TITLE, 1),
    levelRule(HEADER_TAGLINE, 2)
  ]

  // The body family's faces, unless it is the display family, whose
  // faces are already declared above.
  const bodyFaces = bodyFamily && bodyFamily !== family ? fontFaces(bodyFamily) : []

  const css = [
    `/* Generated from theme.font in settings.md - edit the settings, not this file. */`,
    `@layer reset, typography, default, dynamic-typography;`,
    ``,
    ...fontFaces(family),
    ...bodyFaces,
    ``,
    `@layer dynamic-typography {`,
    `  :root {`,
    `    --base-font-size: ${BASE_FONT_SIZE};`,
    ...variables.map(line => `    ${line}`),
    ``,
    ...steps.map(line => `    ${line}`),
    `  }`,
    ``,
    `  h1, h2, h3, h4, h5, h6, ${HEADER_TITLE}, ${HEADER_TAGLINE} {`,
    `    font-family: "${family.cssName}", ${family.stack};`,
    `  }`,
    ``,
    ...[...headingRules, ...headerRules].map(rule => (
      rule.split("\n").map(line => `  ${line}`).join("\n")
    )),
    ...(bodyFamily ? bodyRules(bodyFamily, settings).map(line => `  ${line}`) : []),
    `}`
  ].join("\n")

  const files = [...family.faces, ...(bodyFamily && bodyFamily !== family ? bodyFamily.faces : [])]
  return { css, files: files.map(face => face.file) }
}

/**
 * Body text is one size and one weight: no ramp, no six steps. The
 * family and a single `body-weight` (clamped to what the face has;
 * <strong> still needs room above it, which is the author's problem to
 * notice) are all that is set. TypographyStyles.css's `html` rule keeps
 * the system stack for everything this doesn't name.
 * @param {any} family
 * @param {Record<string, unknown>} settings
 */
function bodyRules(family, settings) {
  const weight = family.axes.find(axis => axis.id === "weight")
  const range = weight ? { min: weight.h1.min, max: weight.h1.max, default: 400 } : { min: 100, max: 900, default: 400 }
  return [
    `body {`,
    `  font-family: "${family.cssName}", ${family.stack};`,
    `  font-weight: ${numericValue(settings, "body-weight", range)};`,
    `}`
  ]
}

/**
 * A body font with no display font configured: faces and the body rule,
 * nothing about headings.
 * @param {any} family
 * @param {Record<string, unknown>} settings
 */
function bodyOnlyCSS(family, settings) {
  const css = [
    `/* Generated from theme.body-font in settings.md - edit the settings, not this file. */`,
    `@layer reset, typography, default, dynamic-typography;`,
    ``,
    ...fontFaces(family),
    ``,
    `@layer dynamic-typography {`,
    ...bodyRules(family, settings).map(line => `  ${line}`),
    `}`
  ].join("\n")
  return { css, files: family.faces.map(face => face.file) }
}

export { families }
