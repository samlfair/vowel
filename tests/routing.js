import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * Every vowel url is lowercase. Votive stores a routed path verbatim
 * (votive f33ba60), so this is vowel's own rule, applied once in
 * config.router for every processor - not just the markdown one.
 */

test("config.router: lowercases every source path, after hashing a secret segment", () => {
  const { router } = createConfig(tmpdir())
  assert.equal(router("Blog/Photo.jpg"), "blog/photo.jpg")
  assert.equal(router("Fonts/Inter-Bold.woff2"), "fonts/inter-bold.woff2")
  // The hash is over the path as typed; only the output is lowercased.
  assert.equal(router("Blog/Hidden##purple-bear/Post.md"), router("Blog/Hidden##purple-bear/Post.md").toLowerCase())
  assert.notEqual(router("Blog/Hidden##purple-bear/Post.md"), router("blog/hidden##purple-bear/post.md"))
})

test("a mixed-case vector and page both land lowercase, and the page's image lookup finds the lowercased file", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-routing-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-routing-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await mkdir(path.join(sourceFolder, "Assets"), { recursive: true })
    await writeFile(path.join(sourceFolder, "Assets", "Logo.svg"), "<svg xmlns='http://www.w3.org/2000/svg'></svg>")
    await writeFile(path.join(sourceFolder, "Hello World.md"), "# Hello World\n\nText.\n")
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred

    const entries = await readdir(targetFolder, { recursive: true })
    assert.ok(entries.includes(path.join("assets", "logo.svg")), entries.join(", "))
    assert.ok(entries.includes("hello-world.html"))
    assert.ok(!entries.some(entry => /[A-Z]/.test(entry)), `uppercase in output: ${entries.filter(e => /[A-Z]/.test(e))}`)
    assert.ok(site.database.target.get("assets/logo.svg"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
