import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

/**
 * A project's own stylesheet is unlayered, so it wins over any rule in a
 * layer, whatever the specificity. That only holds while every theme
 * rule is in one: DefaultStyles.css closed its `@layer default` before
 * the footer and the homepage, and `body.page_home main>[itemprop=slogan]`
 * beat a project's `[itemprop=slogan]` on specificity.
 */

/**
 * The selector or at-rule before each top-level block, comments removed.
 * @param {string} css
 */
function topLevelBlocks(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const blocks = []
  const state = { depth: 0, start: 0 }
  for (const [index, character] of text.split("").entries()) {
    if (character === "{" && state.depth === 0) blocks.push(text.slice(state.start, index).trim())
    if (character === "{") state.depth += 1
    if (character === "}") state.depth -= 1
    if (character === "}" && state.depth === 0) state.start = index + 1
    if (character === ";" && state.depth === 0) state.start = index + 1
  }
  return blocks
}

const sheets = ["ResetStyles.css", "TypographyStyles.css", "DefaultStyles.css", "SyntaxHighlightingStyles.css"]
const read = (name) => readFileSync(new URL(`../stylesheets/${name}`, import.meta.url), "utf-8")

for (const name of sheets) {
  test(`${name}: every rule is in a layer, so a project's stylesheet wins`, () => {
    const unlayered = topLevelBlocks(read(name)).filter(prelude => !prelude.startsWith("@layer"))
    assert.deepEqual(unlayered, [])
  })
}

// A layer named for the first time after the others goes to the end, so
// every sheet that declares an order has to place syntax-highlighting in
// it: before default, so the default theme overrides the highlighting
// (per Sam).
test("every declared layer order has syntax-highlighting just before default", () => {
  const full = ["reset", "typography", "syntax-highlighting", "default", "dynamic-typography"]
  for (const name of sheets) {
    const declarations = [...read(name).matchAll(/@layer ([\w\s,-]+);/g)].map(match => match[1].split(",").map(layer => layer.trim()))
    for (const order of declarations) {
      assert.deepEqual(order, full.slice(0, order.length), `${name}: @layer ${order.join(", ")}`)
    }
  }
  assert.ok(read("SyntaxHighlightingStyles.css").includes("@layer syntax-highlighting {"))
})
