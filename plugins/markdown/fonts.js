// The font catalogue: which families ship with vowel, which files back
// them, and which variation axes each one actually exposes.
//
// Imported by both the build (typography.js, to emit @font-face and the
// ramp) and the browser settings panel (to render only the controls a
// family really has), so this file must stay free of node builtins - the
// same constraint editor/directives.js is under, for the same reason:
// the two halves cannot be allowed to disagree about what a font can do.
//
// Every range below was read out of the font's own fvar table rather
// than transcribed, so a control can never offer a value the font will
// clamp away.

// Ramped axes get three settings - the h1 end, the h6 end, and the power
// curve between them (see typography.js). Non-numeric axes get one value
// for every heading: there is nothing to interpolate between "Roman" and
// "Cursive", and a boolean ramp is just a threshold in disguise.
const RAMP = "ramp"
const CHOICE = "choice"
const FLAG = "flag"

// The high-level CSS properties own these three; everything else goes
// through font-variation-settings. `opsz` is deliberately absent from
// both - naming an axis in font-variation-settings overrides the
// high-level property for it, and optical sizing is meant to track
// font-size on its own (font-optical-sizing: auto is the initial value).
const sizeAxis = {
  id: "size",
  label: "Size",
  kind: RAMP,
  property: "font-size",
  variable: "fs",
  // Multiples of the body font size, resolved against --base-font-size.
  unit: "x",
  h1: { min: 1.75, max: 2.7, step: 0.05, default: 2.4 },
  h6: { min: 1, max: 1.5, step: 0.05, default: 1.05 },
  power: { min: 0.5, max: 4, step: 0.1, default: 2.3 }
}

const letterSpacingAxis = {
  id: "letter-spacing",
  label: "Letter spacing",
  kind: RAMP,
  property: "letter-spacing",
  variable: "ls",
  unit: "ch",
  h1: { min: -0.1, max: 0.1, step: 0.005, default: -0.06 },
  h6: { min: -0.1, max: 0.1, step: 0.005, default: 0.05 },
  power: { min: 0.5, max: 4, step: 0.1, default: 2 }
}

/**
 * The weight ramp, bounded by whatever the chosen family supports.
 * @param {number} min
 * @param {number} max
 */
function weightAxis(min, max) {
  const clamp = value => Math.min(max, Math.max(min, value))

  return {
    id: "weight",
    label: "Weight",
    kind: RAMP,
    property: "font-weight",
    variable: "fw",
    unit: "",
    h1: { min, max, step: 1, default: clamp(900) },
    h6: { min, max, step: 1, default: clamp(700) },
    power: { min: 0.5, max: 4, step: 0.1, default: 2 }
  }
}

/**
 * The width ramp. Unlike weight this has no high-level property here -
 * font-stretch would work, but keeping every non-wght axis in one
 * font-variation-settings declaration means one code path rather than
 * two, and the values are the raw axis units either way.
 * @param {number} min
 * @param {number} max
 */
function widthAxis(min, max) {
  const clamp = value => Math.min(max, Math.max(min, value))

  return {
    id: "width",
    label: "Width",
    kind: RAMP,
    tag: "wdth",
    variable: "wdth",
    unit: "",
    h1: { min, max, step: 1, default: clamp(125) },
    h6: { min, max, step: 1, default: clamp(75) },
    power: { min: 0.5, max: 4, step: 0.1, default: 4 }
  }
}

/**
 * A numeric axis with no high-level CSS property of its own.
 * @param {string} id
 * @param {string} label
 * @param {string} tag
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function variationAxis(id, label, tag, min, max, step) {
  return {
    id,
    label,
    kind: RAMP,
    tag,
    variable: tag.toLowerCase(),
    unit: "",
    h1: { min, max, step, default: min },
    h6: { min, max, step, default: min },
    power: { min: 0.5, max: 4, step: 0.1, default: 2 }
  }
}

export const families = [
  {
    name: "Bricolage",
    // The family name browsers see. Kept distinct from `name` (what a
    // person writes in settings.md) so the two can diverge later.
    cssName: "Bricolage Grotesque",
    stack: "serif",
    faces: [{ file: "bricolage.ttf", style: "normal" }],
    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 800), widthAxis(75, 100)]
  },
  {
    name: "Pliant",
    cssName: "Pliant",
    stack: "sans-serif",
    text: true,
    faces: [
      { file: "pliant-regular.ttf", style: "normal" },
      { file: "pliant-italic.ttf", style: "italic" }
    ],
    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(100, 125)]
  },
  {
    name: "Emberly",
    cssName: "Emberly",
    stack: "serif",
    // Shipped with no italic: the file that came with one was byte for
    // byte the roman.
    faces: [{ file: "emberly-regular.woff2", style: "normal" }],
    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(75, 100)]
  },
  {
    name: "Agrandir",
    cssName: "Agrandir Variable",
    stack: "sans-serif",
    faces: [{ file: "agrandir.woff2", style: "normal" }],
    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(50, 200)]
  },
  {
    name: "Bandeins Strange",
    cssName: "Bandeins Strange Variable",
    stack: "sans-serif",
    faces: [{ file: "bandeins-strange.woff2", style: "normal" }],
    // "Strange Width" in the foundry's own naming, but a real wdth axis -
    // just with a far wider range than the 50-200 the tag usually spans.
    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 800), widthAxis(100, 800)]
  },
  {
    name: "Recursive",
    cssName: "Recursive",
    stack: "sans-serif",
    text: true,
    faces: [{ file: "recursive.ttf", style: "normal" }],
    axes: [
      sizeAxis,
      letterSpacingAxis,
      weightAxis(300, 1000),
      variationAxis("casual", "Casual", "CASL", 0, 1, 0.05),
      variationAxis("monospace", "Monospace", "MONO", 0, 1, 0.05),
      {
        id: "forms",
        label: "Forms",
        kind: CHOICE,
        tag: "CRSV",
        options: [
          { label: "Roman", value: 0 },
          { label: "Auto", value: 0.5 },
          { label: "Cursive", value: 1 }
        ],
        default: 0.5
      }
    ]
  },
  {
    name: "Mona Sans",
    cssName: "Mona Sans",
    stack: "sans-serif",
    text: true,
    faces: [
      { file: "mona-sans-regular.ttf", style: "normal" },
      { file: "mona-sans-italic.ttf", style: "italic" }
    ],
    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 900), widthAxis(75, 125)]
  },
  {
    name: "Fraunces",
    cssName: "Fraunces",
    stack: "serif",
    faces: [
      { file: "fraunces-regular.ttf", style: "normal" },
      { file: "fraunces-italic.ttf", style: "italic" }
    ],
    axes: [
      sizeAxis,
      letterSpacingAxis,
      weightAxis(100, 900),
      variationAxis("softness", "Softness", "SOFT", 0, 100, 1),
      { id: "wonky", label: "Wonky", kind: FLAG, tag: "WONK", default: true }
    ]
  }
]

export { RAMP, CHOICE, FLAG }

/**
 * Matched case-insensitively: settings.md is written by hand, and the
 * panel round trips whatever spelling is already in the file.
 * @param {unknown} name
 */
export function findFamily(name) {
  if (typeof name !== "string") return null
  const wanted = name.trim().toLowerCase()
  return families.find(family => family.name.toLowerCase() === wanted) || null
}

/**
 * The families plausible for body text - marked `text: true` in the
 * catalogue: a real italic or a slant for <em>, and a text-sized end
 * to whatever axes they have. The body picker offers only these, on
 * the same principle as the axis controls: only what the font can
 * actually do. Deliberately minimal (tasks/2-in-progress/body-fonts.md:
 * "don't put too much effort into it, we're going to change it soon").
 */
export const textFamilies = families.filter(family => family.text)

/**
 * A body family by name, or null - including for a name that is a
 * display-only family.
 * @param {unknown} name
 */
export function findTextFamily(name) {
  const family = findFamily(name)
  return family && family.text ? family : null
}

/**
 * Every settings.md key a family's controls read and write, in the
 * `h1-<axis>` / `h6-<axis>` / `heading-<axis>` shape. A non-ramped axis
 * is a single key named for the axis itself.
 * @param {{id: string, kind: string}} axis
 */
export function axisKeys(axis) {
  if (axis.kind !== RAMP) return { value: axis.id }
  return { h1: `h1-${axis.id}`, h6: `h6-${axis.id}`, power: `heading-${axis.id}` }
}

/**
 * Reads one number out of settings, falling back to the axis default and
 * clamping to what the font can actually do. A hand-edited settings.md
 * can ask for a weight the family doesn't have, and the font clamps it
 * silently; doing it here keeps the emitted CSS and the panel's controls
 * honest about what will render.
 * @param {Record<string, unknown>} settings
 * @param {string} key
 * @param {{min: number, max: number, default: number}} range
 */
export function numericValue(settings, key, range) {
  const raw = settings[key]
  const value = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(value)) return range.default
  return Math.min(range.max, Math.max(range.min, value))
}

/**
 * The three numbers a ramped axis is built from: the h1 end, the h6 end,
 * and the power curve between them.
 * @param {any} axis
 * @param {Record<string, unknown>} settings
 */
export function rampValues(axis, settings) {
  const keys = axisKeys(axis)
  return {
    h1: numericValue(settings, keys.h1, axis.h1),
    h6: numericValue(settings, keys.h6, axis.h6),
    power: numericValue(settings, keys.power, axis.power)
  }
}

/**
 * The single value a non-ramped axis carries. A choice is matched by
 * label as well as by value, because a person writes "cursive" in
 * settings.md, not 1.
 * @param {any} axis
 * @param {Record<string, unknown>} settings
 */
export function fixedValue(axis, settings) {
  const raw = settings[axisKeys(axis).value]

  if (axis.kind === FLAG) return (raw === undefined ? axis.default : Boolean(raw)) ? 1 : 0

  const match = axis.options.find(option => (
    String(option.label).toLowerCase() === String(raw).toLowerCase() || option.value === raw
  ))

  return match ? match.value : axis.default
}
