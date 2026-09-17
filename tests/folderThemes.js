import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { themeStylesheets, themeKey } from "../plugins/styles/theme.js"

/**
 * A theme is a folder setting, so a folder can have its own. The root's
 * theme keeps the plain file names; any other theme's generated sheets
 * carry the theme's key, and folders sharing a theme share a file.
 */

test("themeStylesheets: every built-in named, default is the fallthrough, an unknown theme gets nothing", () => {
  assert.deepEqual(themeStylesheets(undefined), ["reset.css", "typography.css", "colors.css", "default.css"])
  assert.deepEqual(themeStylesheets("default"), themeStylesheets(undefined))
  assert.deepEqual(themeStylesheets("Reset"), ["reset.css"])
  assert.deepEqual(themeStylesheets("typography"), ["reset.css", "typography.css"])
  assert.deepEqual(themeStylesheets("bogus"), [])
})

test("themeStylesheets: a theme other than the root's gets keyed generated sheets; the bundled ones are shared", () => {
  const blog = { name: "default", colors: ["#111111", "#222222"] }
  const key = themeKey(blog)
  assert.deepEqual(themeStylesheets(blog, undefined), ["reset.css", "typography.css", `colors-${key}.css`, "default.css"])
  assert.deepEqual(themeStylesheets(blog, blog), ["reset.css", "typography.css", "colors.css", "default.css"])
  // The key is over the canonical form: key order and spelling of the name don't matter.
  assert.equal(themeKey({ colors: ["#111111", "#222222"], name: "Default" }), key)
  assert.notEqual(themeKey({ name: "default", colors: ["#222222", "#111111"] }), key)
})

test("a folder's theme gets its own colours; a folder with none inherits its ancestor's; the root keeps the plain names", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-themes-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-themes-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    const files = {
      "settings.md": "---\ntheme:\n  name: default\n  colors:\n    - \"#ff0000\"\n    - \"#0000ff\"\n---\n",
      "home.md": "# Home\n",
      "blog/settings.md": "---\ntheme:\n  name: default\n  colors:\n    - \"#00ff00\"\n    - \"#ff00ff\"\n---\n",
      "blog/post.md": "# Post\n",
      "blog/deep/note.md": "# Note\n",
      "shop/settings.md": "---\ntheme: reset\n---\n",
      "shop/hats.md": "# Hats\n",
      "shop/hats/red.md": "# Red\n",
      "styles.css": "body { margin: 0 }"
    }
    for (const [rel, body] of Object.entries(files)) {
      const full = path.join(sourceFolder, rel)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred

    const page = (file) => readFile(path.join(targetFolder, file), "utf-8")
    const links = (html) => [...html.matchAll(/<link rel=stylesheet href=\/([^?>]+)/g)].map(m => m[1])
    const blogKey = themeKey({ name: "default", colors: ["#00ff00", "#ff00ff"] })

    assert.deepEqual(links(await page("index.html")), ["reset.css", "typography.css", "colors.css", "default.css", "styles.css"])
    assert.deepEqual(links(await page(path.join("blog", "post.html"))), ["reset.css", "typography.css", `colors-${blogKey}.css`, "default.css", "styles.css"])
    assert.deepEqual(links(await page(path.join("blog", "deep", "note.html"))), links(await page(path.join("blog", "post.html"))), "a subfolder inherits blog's theme")
    assert.deepEqual(links(await page(path.join("shop", "hats.html"))), ["reset.css", "styles.css"])
    assert.deepEqual(links(await page(path.join("shop", "hats", "red.html"))), ["reset.css", "styles.css"], "reset at shop means reset below it, not default")

    // Both colour files exist, each from its own palette, and no other generated sheet does.
    const root = await readdir(targetFolder)
    assert.deepEqual(root.filter(name => /^colors/.test(name)).sort(), ["colors.css", `colors-${blogKey}.css`].sort())
    const rootColors = await page("colors.css")
    const blogColors = await page(`colors-${blogKey}.css`)
    assert.notEqual(rootColors, blogColors)
    assert.ok(rootColors.includes("--primary-") && blogColors.includes("--primary-"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
