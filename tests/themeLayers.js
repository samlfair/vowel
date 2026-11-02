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

for (const name of ["ResetStyles.css", "TypographyStyles.css", "DefaultStyles.css"]) {
  test(`${name}: every rule is in a layer, so a project's stylesheet wins`, () => {
    const css = readFileSync(new URL(`../stylesheets/${name}`, import.meta.url), "utf-8")
    const unlayered = topLevelBlocks(css).filter(prelude => !prelude.startsWith("@layer"))
    assert.deepEqual(unlayered, [])
  })
}
