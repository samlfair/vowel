import { test } from "node:test"
import assert from "node:assert"
import {
  splitFrontmatter,
  joinFrontmatter,
  themeObject
} from "../plugins/html/editor/settings-file.js"

const file = `---
title: Style Builder
theme:
  name: Default
  colors:
    - "#ff0000"
  font: Fraunces
domain: style.com
---
# Hello

Body text.
`

test("settings file: frontmatter splits off from the body", () => {
  const { data, body, had } = splitFrontmatter(file)

  assert.equal(had, true)
  assert.equal(data.title, "Style Builder")
  assert.deepEqual(data.theme.colors, ["#ff0000"])
  assert.equal(body, "# Hello\n\nBody text.\n")
})

test("settings file: a file with no frontmatter is all body", () => {
  const { data, body, had } = splitFrontmatter("# Just a heading\n")

  assert.deepEqual(data, {})
  assert.equal(had, false)
  assert.equal(body, "# Just a heading\n")
})

test("settings file: writing one key leaves every other key and the body alone", () => {
  const { data, body } = splitFrontmatter(file)
  const theme = { ...themeObject(data.theme), font: "Recursive", "h1-size": 2.2 }
  const written = joinFrontmatter({ ...data, theme }, body)

  const reread = splitFrontmatter(written)

  assert.equal(reread.data.title, "Style Builder")
  assert.equal(reread.data.domain, "style.com")
  assert.equal(reread.data.theme.name, "Default")
  assert.deepEqual(reread.data.theme.colors, ["#ff0000"])
  assert.equal(reread.data.theme.font, "Recursive")
  assert.equal(reread.data.theme["h1-size"], 2.2)
  assert.equal(reread.body, "# Hello\n\nBody text.\n")
})

test("settings file: a round trip with no changes is stable", () => {
  const { data, body } = splitFrontmatter(file)
  const once = joinFrontmatter(data, body)
  const twice = joinFrontmatter(...Object.values(splitFrontmatter(once)).slice(0, 2))

  assert.equal(once, twice)
})

test("settings file: a bare theme name becomes the object form", () => {
  assert.deepEqual(themeObject("default"), { name: "default" })
  assert.deepEqual(themeObject({ name: "Default", font: "Pliant" }), { name: "Default", font: "Pliant" })
  assert.deepEqual(themeObject(undefined), {})
  assert.deepEqual(themeObject(["default"]), {})
})

test("settings file: the theme object is copied, not aliased", () => {
  const theme = { name: "Default" }
  const copy = themeObject(theme)
  copy.font = "Emberly"

  assert.equal(theme.font, undefined)
})
