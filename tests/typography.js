import test from "node:test"
import assert from "node:assert/strict"
import { typographyCSS, typographyVariables, rampSettings, fontSettings } from "../plugins/markdown/typography.js"
import { readFileSync } from "node:fs"

/**
 * The ramps live in TypographyStyles.css. typography.js only maps theme
 * settings onto the variables the sheet declares, emitting the ones the
 * author set. The same table drives the settings panel's live preview.
 */

const sheet = readFileSync(new URL("../stylesheets/TypographyStyles.css", import.meta.url), "utf-8")

test("typography: every setting maps to a variable the sheet actually declares", () => {
  for (const { variable } of [...rampSettings, ...fontSettings]) {
    assert.ok(sheet.includes(`${variable}:`), `${variable} is declared in TypographyStyles.css`)
  }
})

test("typography: nothing configured produces no stylesheet, so the sheet's defaults stand", () => {
  assert.equal(typographyCSS(undefined), null)
  assert.equal(typographyCSS("default"), null)
  assert.equal(typographyCSS({ name: "default" }), null)
  assert.equal(typographyCSS({ name: "default", "heading-size": "" }), null)
})

test("typography: only the keys the author set are emitted, in the typography layer", () => {
  const { css } = typographyCSS({ name: "default", "heading-size": 2.5, "h1-weight": 700 })
  assert.match(css, /^\/\* Generated/)
  assert.ok(css.includes("@layer typography {"))
  assert.ok(css.includes("--font-size-delta: calc(2.5 * var(--font-size-root));"))
  assert.ok(css.includes("--font-weight-h1: 700;"))
  assert.ok(!css.includes("--font-weight-h6"), "an unset key is the sheet's business")
  assert.ok(!css.includes("dynamic-typography"))
})

test("typography: values are clamped to their range and trailing zeroes dropped", () => {
  const pairs = Object.fromEntries(typographyVariables({ "h1-weight": 1000, "h6-letter-spacing": -1, "heading-size-decay": 2.50 }))
  assert.equal(pairs["--font-weight-h1"], "900")
  assert.equal(pairs["--letter-spacing-h6"], "-0.1ch")
  assert.equal(pairs["--font-size-decay"], "2.5")
})

test("typography: a font name is quoted; a stack or an already-quoted name is left alone", () => {
  const pairs = Object.fromEntries(typographyVariables({ font: "Mona Sans", "serif-font": "Georgia, serif", "monospace-font": "'Fira Code'" }))
  assert.equal(pairs["--font-sans-brand"], '"Mona Sans"')
  assert.equal(pairs["--font-serif-brand"], "Georgia, serif")
  assert.equal(pairs["--font-monospace-brand"], "'Fira Code'")
  assert.equal(typographyVariables({ font: "   " }).length, 0)
})

test("typography: a non-numeric ramp value is ignored rather than emitted", () => {
  assert.deepEqual(typographyVariables({ "heading-size": "big", "h1-weight": null }), [])
})
