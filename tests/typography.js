import { test } from "node:test"
import assert from "node:assert"
import { typographyCSS } from "../plugins/markdown/typography.js"
import { families, findFamily, rampValues, fixedValue, RAMP } from "../plugins/markdown/fonts.js"

test("typography: no font configured produces no stylesheet", () => {
  assert.equal(typographyCSS({ name: "default" }), null)
  assert.equal(typographyCSS({ font: "Helvetica" }), null)
  assert.equal(typographyCSS("default"), null)
  assert.equal(typographyCSS(undefined), null)
})

test("typography: the family is matched case-insensitively", () => {
  assert.ok(typographyCSS({ font: "fraunces" }))
  assert.ok(typographyCSS({ font: "  MONA SANS " }))
})

test("typography: only the selected family's faces are emitted", () => {
  const { css, files } = typographyCSS({ font: "Fraunces" })

  assert.deepEqual(files, ["fraunces-regular.ttf", "fraunces-italic.ttf"])
  assert.equal(css.match(/@font-face/g).length, 2)

  for (const family of families) {
    if (family.name === "Fraunces") continue
    assert.ok(!css.includes(family.cssName), `${family.cssName} leaked into a Fraunces stylesheet`)
  }
})

test("typography: a family with no italic emits one face", () => {
  const { files, css } = typographyCSS({ font: "Emberly" })

  assert.deepEqual(files, ["emberly-regular.woff2"])
  assert.ok(css.includes('format("woff2")'))
  assert.ok(!css.includes("font-style: italic"))
})

test("typography: settings drive the ramp variables", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  const { css } = typographyCSS({ font: "Mona Sans", "h1-size": 2.5, "h6-size": 1.2, "heading-size": 1.4 })

  assert.ok(css.includes("--fs-end: calc(var(--base-font-size) * 2.5);"))
  assert.ok(css.includes("--fs-start: calc(var(--base-font-size) * 1.2);"))
  assert.ok(css.includes("--fs-power: 1.4;"))
})

test("typography: values outside the font's own range are clamped", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  // Bricolage tops out at 800; Mona Sans starts at 200.
  assert.ok(typographyCSS({ font: "Bricolage", "h1-weight": 1000 }).css.includes("--fw-end: 800;"))
  assert.ok(typographyCSS({ font: "Mona Sans", "h6-weight": 50 }).css.includes("--fw-start: 200;"))
})

test("typography: a size is a multiple of the body font, not a length", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  const { css } = typographyCSS({ font: "Pliant" })

  assert.ok(css.includes("--base-font-size: clamp(1rem, 0.875rem + 0.333vw, 1.125rem);"))
  assert.ok(/--fs-end: calc\(var\(--base-font-size\) \* [\d.]+\);/.test(css))
})

test("typography: booleans and choices get one value everywhere they apply", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  // Six headings plus the site title and tagline, which ride the same
  // ramp - the same literal in every rule, never interpolated.
  const rules = 8

  const wonky = typographyCSS({ font: "Fraunces", wonky: true }).css
  assert.equal(wonky.match(/"WONK" 1/g).length, rules)

  const plain = typographyCSS({ font: "Fraunces", wonky: false }).css
  assert.equal(plain.match(/"WONK" 0/g).length, rules)

  const cursive = typographyCSS({ font: "Recursive", forms: "Cursive" }).css
  assert.equal(cursive.match(/"CRSV" 1/g).length, rules)
  assert.equal(typographyCSS({ font: "Recursive" }).css.match(/"CRSV" 0.5/g).length, rules)
})

test("typography: numeric axes without a CSS property are ramped, not fixed", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  const { css } = typographyCSS({ font: "Recursive", "h1-casual": 1, "h6-casual": 0 })

  assert.ok(css.includes("--casl-end: 1;"))
  assert.ok(css.includes("--casl-start: 0;"))
  assert.ok(css.includes("--casl1: calc(var(--casl-start)"))
  assert.ok(css.includes('"CASL" var(--casl1)'))
})

test("typography: wght and opsz never appear in font-variation-settings", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  // Naming an axis there overrides the high-level property for it, which
  // would freeze optical sizing and break font-weight.
  for (const family of families) {
    const { css } = typographyCSS({ font: family.name })

    for (const declaration of css.match(/font-variation-settings:[^;]+;/g) ?? []) {
      assert.ok(!declaration.includes('"wght"'), `${family.name} set wght via font-variation-settings`)
      assert.ok(!declaration.includes('"opsz"'), `${family.name} set opsz via font-variation-settings`)
    }

    assert.ok(css.includes("font-weight: var(--fw1);"), `${family.name} lost its weight ramp`)
    assert.ok(css.includes("--fw1: calc(var(--fw-start)"), `${family.name} lost its weight steps`)
  }
})

test("typography: every heading level gets a rule off a resolved step", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  const { css } = typographyCSS({ font: "Bricolage" })

  for (const level of [1, 2, 3, 4, 5, 6]) {
    assert.ok(css.includes(`h${level} {`))
    assert.ok(css.includes(`font-size: var(--fs${level});`))
  }

  // h1 sits at the far end of the ramp, h6 at the near end.
  assert.ok(css.includes("--fs1: calc(var(--fs-start) + calc(var(--fs-delta) * pow(calc(6 / 6)"))
  assert.ok(css.includes("--fs6: calc(var(--fs-start) + calc(var(--fs-delta) * pow(calc(1 / 6)"))
})

test("typography: the layer statement puts dynamic-typography last", () => {
  const { css } = typographyCSS({ font: "Agrandir" })

  // The full order is declared here as well as in DefaultStyles.css, and
  // this sheet loads first. A statement that named only some of the
  // layers would leave the rest to be appended after it - a later
  // @layer statement adds unknown layers at the end - which would put
  // `default` above this one.
  assert.ok(css.includes("@layer reset, typography, default, dynamic-typography;"))
  assert.ok(css.includes("@layer dynamic-typography {"))
})

test("typography: the site title and tagline ride the same ramp", { skip: "the ramps moved into TypographyStyles.css (vowel 4cab31d); what type.css still emits for them is open - tasks/2-in-progress/typography-ramps-into-stylesheet.md" }, () => {
  const { css } = typographyCSS({ font: "Mona Sans" })

  assert.match(css, /header #title \{\n\s+font-size: var\(--fs1\);/)
  assert.match(css, /header #tagline \{\n\s+font-size: var\(--fs2\);/)
  assert.ok(css.includes("header #title {\n    font-size: var(--fs1);\n    letter-spacing: var(--ls1);\n    font-weight: var(--fw1);"))

  // The display family reaches them too - the point of the exercise.
  assert.ok(css.includes("h1, h2, h3, h4, h5, h6, header #title, header #tagline {"))
})

test("typography: the header rules set type and nothing else", () => {
  // #tagline's display is the default theme's: hidden in the header,
  // shown as the homepage hero. A typography sheet must not touch it.
  const { css } = typographyCSS({ font: "Fraunces" })
  const header = css.slice(css.indexOf("header #title {"))

  for (const property of ["display", "color", "background", "padding", "margin", "order", "width"]) {
    assert.ok(!header.includes(`${property}:`), `header rules set ${property}`)
  }
})

test("typography: an unconfigured site gets no header rules at all", () => {
  assert.equal(typographyCSS({ name: "default" }), null)
})

test("fonts: every family exposes only axes it actually has", () => {
  const axesOf = name => findFamily(name).axes.map(axis => axis.id)

  assert.deepEqual(axesOf("Fraunces"), ["size", "letter-spacing", "weight", "softness", "wonky"])
  assert.deepEqual(axesOf("Recursive"), ["size", "letter-spacing", "weight", "casual", "monospace", "forms"])
  assert.deepEqual(axesOf("Mona Sans"), ["size", "letter-spacing", "weight", "width"])

  // Neither variable-width family offers the other's extras.
  assert.ok(!axesOf("Mona Sans").includes("softness"))
  assert.ok(!axesOf("Fraunces").includes("width"))
})

test("fonts: shared resolvers clamp and default the same way the CSS does", () => {
  const weight = findFamily("Bricolage").axes.find(axis => axis.id === "weight")

  assert.equal(rampValues(weight, { "h1-weight": 5000 }).h1, 800)
  assert.equal(rampValues(weight, {}).h1, weight.h1.default)
  assert.equal(rampValues(weight, { "h1-weight": "not a number" }).h1, weight.h1.default)

  const forms = findFamily("Recursive").axes.find(axis => axis.id === "forms")
  assert.equal(fixedValue(forms, { forms: "roman" }), 0)
  assert.equal(fixedValue(forms, { forms: "nonsense" }), 0.5)
})

test("fonts: every ramped axis declares a full range and a default inside it", () => {
  for (const family of families) {
    for (const axis of family.axes.filter(axis => axis.kind === RAMP)) {
      for (const part of ["h1", "h6", "power"]) {
        const range = axis[part]
        assert.ok(range.min < range.max, `${family.name} ${axis.id} ${part} has an empty range`)
        assert.ok(
          range.default >= range.min && range.default <= range.max,
          `${family.name} ${axis.id} ${part} defaults outside its own range`
        )
      }
    }
  }
})

test("body font: a text family sets body { font-family, font-weight } and ships its faces alongside the display font's", () => {
  const result = typographyCSS({ name: "Default", font: "Fraunces", "body-font": "Mona Sans", "body-weight": 450 })
  assert.match(result.css, /body \{\n\s+font-family: "Mona Sans", sans-serif;\n\s+font-weight: 450;/)
  assert.deepStrictEqual(result.files, ["fraunces-regular.ttf", "fraunces-italic.ttf", "mona-sans-regular.ttf", "mona-sans-italic.ttf"])
})

test("body font: a display-only family is refused, and the body weight is clamped to the face", () => {
  assert.strictEqual(typographyCSS({ name: "Default", "body-font": "Emberly" }), null)
  const result = typographyCSS({ name: "Default", "body-font": "Pliant", "body-weight": 5000 })
  assert.match(result.css, /font-weight: 900;/)
})

test("body font: without a display font, only the body rule and its faces are emitted; the same family for both declares its faces once", () => {
  const bodyOnly = typographyCSS({ name: "Default", "body-font": "Recursive" })
  assert.ok(bodyOnly.css.includes("body {"))
  assert.ok(!bodyOnly.css.includes("h1"))
  assert.deepStrictEqual(bodyOnly.files, ["recursive.ttf"])

  const both = typographyCSS({ name: "Default", font: "Recursive", "body-font": "Recursive" })
  assert.strictEqual((both.css.match(/@font-face/g) || []).length, 1)
  assert.deepStrictEqual(both.files, ["recursive.ttf"])
})
