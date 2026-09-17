import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * A project's stylesheets are a listing of .css targets per ancestor
 * folder, not a setting the styles plugin pushes into the same label the
 * theme's built-ins live under (which is what once needed a multi-writer
 * accumulator behind every settings row). So: a sheet in blog/ links
 * from blog/'s pages and not the root's, after the theme's own sheets,
 * and folder membership takes the link away when the file goes.
 */
async function links(targetFolder, name) {
  const html = await readFile(path.join(targetFolder, name), "utf-8")
  return (html.match(/<link rel=stylesheet href=[^ >]*/g) || []).map(link => link.split("href=")[1].split("?")[0])
}

test("a subfolder's styles.css links from its own pages only, after the theme sheets, and unlinks when deleted", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-sheets-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-sheets-sys-"))
  let site

  try {
    await mkdir(path.join(sourceFolder, "blog"))
    await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: T\n---\n")
    await writeFile(path.join(sourceFolder, "about.md"), "# About\n\nProse.\n")
    await writeFile(path.join(sourceFolder, "styles.css"), "body { color: red }\n")
    await writeFile(path.join(sourceFolder, "blog", "post.md"), "# Post\n\nA post.\n")
    await writeFile(path.join(sourceFolder, "blog", "styles.css"), "article { color: blue }\n")

    const targetFolder = path.join(systemFolder, "output")
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await site.build()

    const post = await links(targetFolder, "blog/post.html")
    const about = await links(targetFolder, "about.html")

    assert.ok(post.includes("/blog/styles.css"), `blog/post.html should link blog/styles.css: ${post}`)
    assert.ok(!about.includes("/blog/styles.css"), `about.html should not link blog/styles.css: ${about}`)
    assert.ok(about.includes("/styles.css") && post.includes("/styles.css"), "both link the root sheet")
    assert.ok(post.indexOf("/reset.css") < post.indexOf("/styles.css"), "theme sheets come first")
    assert.ok(post.indexOf("/styles.css") < post.indexOf("/blog/styles.css"), "root's sheet before the subfolder's")

    await rm(path.join(sourceFolder, "blog", "styles.css"))
    await site.build({ changed: [], deleted: ["blog/styles.css"], defer: false })

    const postAfter = await links(targetFolder, "blog/post.html")
    assert.ok(!postAfter.includes("/blog/styles.css"), `the link should be gone after deletion: ${postAfter}`)
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
