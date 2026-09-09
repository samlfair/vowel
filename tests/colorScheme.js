import test from "node:test"
import assert from "node:assert/strict"
import { colorSchemeCSS, themeColorSchemeCSS, fallbackColors } from "../plugins/markdown/colorScheme.js"

const roles = ["primary", "secondary", "tertiary", "accent", "success", "info", "warning", "danger"]

test("colorSchemeCSS: no colors configured falls back to Vowel's brand pair", () => {
  assert.deepEqual(fallbackColors, ["#00edc6", "#5119ff"])

  const branded = colorSchemeCSS(fallbackColors)
  assert.equal(colorSchemeCSS(undefined), branded)
  assert.equal(colorSchemeCSS(null), branded)

  // Not merely non-empty - DefaultStyles.css consumes these
  // unconditionally, so an un-themed site must still get all of them.
  assert.equal(branded.match(/--/g).length, 96)
})

test("themeColorSchemeCSS: reports bad colors and still returns a usable scheme", () => {
  const errors = []
  const css = themeColorSchemeCSS(["#000000", "#cc6633"], error => errors.push(error.message))

  assert.equal(errors.length, 1)
  assert.match(errors[0], /chroma of zero/)
  assert.equal(css, colorSchemeCSS(fallbackColors))
})

test("themeColorSchemeCSS: valid colors are used as given, with no error", () => {
  const errors = []
  const css = themeColorSchemeCSS(["#3366cc", "#cc6633"], error => errors.push(error))

  assert.equal(errors.length, 0)
  assert.equal(css, colorSchemeCSS(["#3366cc", "#cc6633"]))
  assert.notEqual(css, colorSchemeCSS(fallbackColors))
})

test("colorSchemeCSS: emits every role at 12 shades", () => {
  const css = colorSchemeCSS(["#3366cc", "#cc6633"])

  for (const role of roles) {
    for (let shade = 0; shade < 12; shade++) {
      const name = `--${role}-${String(shade).padStart(2, "0")}`
      assert.ok(css.includes(`${name}: #`), `expected ${name}`)
    }
  }

  // 8 roles x 12 shades, and nothing beyond them.
  assert.equal(css.match(/--/g).length, 96)
  assert.ok(!css.includes("-12"))
})

test("colorSchemeCSS: shade 00 is the lightest, 11 the darkest", () => {
  // DefaultStyles.css reads these as
  // `light-dark(var(--primary-00), var(--primary-11))`, so 00 is the
  // light-mode background. colorhorse orders its ramps the other way,
  // and getting this backwards inverts the whole site.
  const css = colorSchemeCSS(["#3366cc", "#cc6633"])
  const value = (name) => css.match(new RegExp(`${name}: (#[0-9a-f]+);`))[1]

  /** @param {string} hex */
  function brightness(hex) {
    const full = hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
    const [r, g, b] = [1, 3, 5].map(i => parseInt(full.slice(i, i + 2), 16))
    return r + g + b
  }

  assert.ok(brightness(value("--primary-00")) > brightness(value("--primary-11")))
  assert.ok(brightness(value("--primary-00")) > brightness(value("--primary-06")))
  assert.ok(brightness(value("--primary-06")) > brightness(value("--primary-11")))
})

test("colorSchemeCSS: rejects anything that isn't a pair of colors", () => {
  assert.throws(() => colorSchemeCSS(["#3366cc"]), /array of two/)
  assert.throws(() => colorSchemeCSS(["#3366cc", "#cc6633", "#33cc66"]), /array of two/)
  assert.throws(() => colorSchemeCSS("#3366cc"), /array of two/)
  assert.throws(() => colorSchemeCSS({ one: "#3366cc" }), /array of two/)
})

test("colorSchemeCSS: lets colorhorse's own validation messages through", () => {
  // A gray seed can't anchor a hue ring, and colorhorse says so
  // precisely - more useful to the author than anything restated here.
  assert.throws(() => colorSchemeCSS(["#000000", "#cc6633"]), /chroma of zero/)
  assert.throws(() => colorSchemeCSS(["nonsense", "#cc6633"]), /hex string/)
})
