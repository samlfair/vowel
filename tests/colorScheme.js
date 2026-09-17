import test from "node:test"
import assert from "node:assert/strict"
import { colorSchemeCSS, themeColorSchemeCSS, fallbackColors } from "../plugins/markdown/colorScheme.js"

const roles = ["primary", "secondary", "tertiary", "accent", "success", "info", "warning", "danger"]

test("colorSchemeCSS: no colors configured falls back to Vowel's brand pair", () => {
  assert.deepEqual(fallbackColors, ["#5119ff", "#00edc6"])

  const branded = colorSchemeCSS(fallbackColors)
  assert.equal(colorSchemeCSS(undefined), branded)
  assert.equal(colorSchemeCSS(null), branded)

  // Not merely non-empty - DefaultStyles.css consumes these
  // unconditionally, so an un-themed site must still get all of them.
  assert.equal(branded.match(/--/g).length, 80)
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

test("colorSchemeCSS: emits every role at 10 shades, named 01 to 10", () => {
  const css = colorSchemeCSS(["#3366cc", "#cc6633"])

  for (const role of roles) {
    for (let shade = 1; shade <= 10; shade++) {
      const name = `--${role}-${String(shade).padStart(2, "0")}`
      assert.ok(css.includes(`${name}: #`), `expected ${name}`)
    }
  }

  // 8 roles x 10 shades, and nothing beyond them.
  assert.equal(css.match(/--/g).length, 80)
  assert.ok(!css.includes("-00"))
  assert.ok(!css.includes("-11"))
})

test("colorSchemeCSS: shade 01 is the darkest, 10 the lightest", () => {
  // DefaultStyles.css reads these as
  // `light-dark(var(--primary-10), var(--primary-01))` for the body
  // background, so 10 is the light-mode background and 01 the text.
  // That is colorhorse's own order (darkest first), kept as given;
  // getting this backwards inverts the whole site.
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

  assert.ok(brightness(value("--primary-10")) > brightness(value("--primary-01")))
  assert.ok(brightness(value("--primary-10")) > brightness(value("--primary-05")))
  assert.ok(brightness(value("--primary-05")) > brightness(value("--primary-01")))
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
