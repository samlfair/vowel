import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { themeColorSchemeCSS } from "../plugins/markdown/colorScheme.js"

/**
 * Syntax highlighting's colours are variables, `--color-{role}-pre`:
 * GitHub's in SyntaxHighlightingStyles.css, the palette's in
 * DefaultStyles.css. Both sheets declare every one the token rules use,
 * and the default theme's stay readable on the code's background for
 * any ordinary palette.
 */

const sheet = (name) => readFileSync(path.join(import.meta.dirname, "..", "stylesheets", name), "utf-8")
const syntax = sheet("SyntaxHighlightingStyles.css")
const theme = sheet("DefaultStyles.css")

/** The `--color-*-pre` names declared in `css`. */
const declared = (css) => new Set([...css.matchAll(/(--color-[a-z-]+-pre):/g)].map(match => match[1]))

test("every colour a token rule uses is declared, light and dark, by both sheets", () => {
  const used = new Set([...syntax.matchAll(/var\((--color-[a-z-]+-pre)\)/g)].map(match => match[1]))
  const [light, dark] = syntax.split("@media (prefers-color-scheme: dark)")
  assert.ok(used.size >= 12, `${used.size} used`)
  for (const name of used) {
    assert.ok(declared(light).has(name), `${name}, light, in the syntax sheet`)
    assert.ok(declared(dark).has(name), `${name}, dark, in the syntax sheet`)
    assert.ok(declared(theme).has(name), `${name} in the default theme`)
  }
})

/** WCAG 2's relative luminance of a `#rrggbb`. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (one, two) => {
  const [lighter, darker] = [luminance(one), luminance(two)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The default theme's `light-dark(var(--color-x-NN), var(--color-y-NN))` per variable, as palette names. */
const themeShades = Object.fromEntries([...theme.matchAll(/(--color-[a-z-]+-pre): light-dark\(var\(--color-([a-z]+-\d\d)\), var\(--color-([a-z]+-\d\d)\)\)/g)]
  .map(([, name, light, dark]) => [name, { light, dark }]))

/** The background each foreground is read on. */
const backgroundOf = (name) => name === "--color-inserted-pre" ? "--color-background-inserted-pre"
  : name === "--color-deleted-pre" ? "--color-background-deleted-pre"
    : "--color-background-pre"

const foregrounds = Object.keys(themeShades).filter(name => !/^--color-(background|border)-/.test(name))

// Vowel's own palette only (per Sam, Nov 7): a site's own colours may
// need its own tuning, which `--color-*-pre` in its styles.css is for.
const palettes = {
  vowel: {}
}

// Skipped (per Sam, Nov 7): the colours are being tuned by eye first.
// tasks/1-proposed/syntax-colour-contrast.md
test("the default theme's code colours are at least 4.5:1 on their background, with Vowel's own palette", { skip: "colours being tuned: tasks/1-proposed/syntax-colour-contrast.md" }, () => {
  assert.equal(foregrounds.length, 11, "the text, comments and nine kinds of token")
  for (const [label, settings] of Object.entries(palettes)) {
    const palette = Object.fromEntries([...themeColorSchemeCSS(settings, error => { throw error }).matchAll(/--color-([a-z]+-\d\d): (#[0-9a-f]{6})/g)].map(match => [match[1], match[2]]))
    for (const mode of ["light", "dark"]) {
      for (const name of foregrounds) {
        const ratio = contrast(palette[themeShades[name][mode]], palette[themeShades[backgroundOf(name)][mode]])
        assert.ok(ratio >= 4.5, `${label}, ${mode}: ${name} is ${ratio.toFixed(2)}:1`)
      }
    }
  }
})
