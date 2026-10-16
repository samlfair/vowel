import test from "node:test"
import assert from "node:assert/strict"
import { colorSchemeCSS, themeColorSchemeCSS, colorParams, fallbackColors } from "../plugins/markdown/colorScheme.js"

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
  const css = themeColorSchemeCSS({ colors: ["#000000", "#cc6633"] }, error => errors.push(error.message))

  assert.equal(errors.length, 1)
  assert.match(errors[0], /^ignoring theme\.colors - .*chroma of zero/)
  assert.equal(css, colorSchemeCSS(fallbackColors))
})

test("themeColorSchemeCSS: valid colors are used as given, with no error", () => {
  const errors = []
  const css = themeColorSchemeCSS({ colors: ["#3366cc", "#cc6633"] }, error => errors.push(error))

  assert.equal(errors.length, 0)
  assert.equal(css, colorSchemeCSS(["#3366cc", "#cc6633"]))
  assert.notEqual(css, colorSchemeCSS(fallbackColors))
})

test("colorSchemeCSS: emits every role at 10 shades, named 01 to 10", () => {
  const css = colorSchemeCSS(["#3366cc", "#cc6633"])

  for (const role of roles) {
    for (let shade = 1; shade <= 10; shade++) {
      const name = `--color-${role}-${String(shade).padStart(2, "0")}`
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
  // `light-dark(var(--color-primary-10), var(--color-primary-01))` for the body
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

  assert.ok(brightness(value("--color-primary-10")) > brightness(value("--color-primary-01")))
  assert.ok(brightness(value("--color-primary-10")) > brightness(value("--color-primary-05")))
  assert.ok(brightness(value("--color-primary-05")) > brightness(value("--color-primary-01")))
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

/** @param {string} css @param {string} name */
function shade(css, name) {
  return css.match(new RegExp(`${name}: (#[0-9a-f]+);`))[1]
}

test("themeColorSchemeCSS: with no settings, the scheme is colorSchemeCSS's", () => {
  const errors = []
  const css = themeColorSchemeCSS({ colors: ["#3366cc", "#cc6633"] }, error => errors.push(error))
  assert.deepEqual(errors, [])
  assert.equal(css, colorSchemeCSS(["#3366cc", "#cc6633"]))
})

test("themeColorSchemeCSS: darkest-shade, lightest-shade, min-saturation and contrast each change the scheme", () => {
  const colors = ["#3366cc", "#cc6633"]
  const plain = colorSchemeCSS(colors)
  const settings = [
    { "darkest-shade": 0.1 },
    { "lightest-shade": 0.8 },
    { "min-saturation": 0.6 },
    { contrast: 0.8 }
  ]
  for (const setting of settings) {
    const errors = []
    const css = themeColorSchemeCSS({ colors, ...setting }, error => errors.push(error))
    assert.deepEqual(errors, [], JSON.stringify(setting))
    assert.notEqual(css, plain, JSON.stringify(setting))
  }
})

test("themeColorSchemeCSS: a lower darkest-shade gives a darker shade 01", () => {
  const colors = ["#3366cc", "#cc6633"]
  const darker = themeColorSchemeCSS({ colors, "darkest-shade": 0.1 }, () => {})
  const lighter = themeColorSchemeCSS({ colors, "darkest-shade": 0.5 }, () => {})
  /** @param {string} hex - "#rrggbb" */
  const brightness = hex => [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0)
  assert.ok(brightness(shade(darker, "--color-primary-01")) < brightness(shade(lighter, "--color-primary-01")))
})

test("themeColorSchemeCSS: a bad setting is reported and left at its default, the colors kept", () => {
  const colors = ["#3366cc", "#cc6633"]
  const plain = colorSchemeCSS(colors)
  const bad = [
    { contrast: 2 },
    { contrast: "high" },
    { "darkest-shade": -0.1 },
    { "lightest-shade": 1.5 },
    { "min-saturation": "0.2" }
  ]
  for (const setting of bad) {
    const errors = []
    const css = themeColorSchemeCSS({ colors, ...setting }, error => errors.push(error.message))
    const [key] = Object.keys(setting)
    assert.equal(errors.length, 1, JSON.stringify(setting))
    assert.match(errors[0], new RegExp(`^ignoring theme\\.${key} - expected a number from 0 to 1`))
    assert.equal(css, plain, JSON.stringify(setting))
  }
})

test("themeColorSchemeCSS: a darkest shade at or above the lightest is reported and both left at their defaults", () => {
  const colors = ["#3366cc", "#cc6633"]
  const errors = []
  const css = themeColorSchemeCSS({ colors, "darkest-shade": 0.8, "lightest-shade": 0.4, contrast: 0.5 }, error => errors.push(error.message))
  assert.equal(errors.length, 1)
  assert.match(errors[0], /darkest shade \(0\.8\) must be below the lightest \(0\.4\)/)
  assert.equal(css, themeColorSchemeCSS({ colors, contrast: 0.5 }, () => {}))
})

test("themeColorSchemeCSS: unusable colors fall back to the brand colors with the settings kept", () => {
  const errors = []
  const css = themeColorSchemeCSS({ colors: ["#000000", "#cc6633"], contrast: 0.5 }, error => errors.push(error))
  assert.equal(errors.length, 1)
  assert.equal(css, themeColorSchemeCSS({ colors: fallbackColors, contrast: 0.5 }, () => {}))
  assert.notEqual(css, colorSchemeCSS(fallbackColors))
})

test("colorParams: carries the colors and every scheme setting, null where unset", () => {
  assert.deepEqual(colorParams({ name: "Default", colors: ["#3366cc", "#cc6633"], contrast: 0.4, "h1-weight": 700 }), {
    colors: ["#3366cc", "#cc6633"],
    "darkest-shade": null,
    "lightest-shade": null,
    "min-saturation": null,
    contrast: 0.4
  })
})
