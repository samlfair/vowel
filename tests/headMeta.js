import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * What a page's <head> tells search engines and link previews: the
 * description as both `description` and `og:description`, and an
 * `og:image` - the page's own, else the `fallback_image` setting.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-head-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-head-sys-"))
  let site
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
      await writeFile(path.join(sourceFolder, rel), body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await run((file) => readFile(path.join(systemFolder, "output", file), "utf-8"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const head = (html) => html.match(/<head>[\s\S]*?<\/head>|<meta charset[\s\S]*?<body/)[0]

test("a page's description is in <meta name=description> as well as og:description", async () => {
  await withSite({ "home.md": "# Home\n", "about.md": "---\ndescription: All about us.\n---\n# About\n" }, async (page) => {
    const about = head(await page("about.html"))
    assert.match(about, /<meta name=description content="All about us\.">/)
    assert.match(about, /<meta property=og:description content="All about us\.">/)
  })
})

test("og:image is the page's own image, else the fallback_image setting, resolved from the root", async () => {
  await withSite({
    "settings.md": "---\nfallback_image: share.png\n---\n",
    "home.md": "# Home\n",
    "plain.md": "# Plain\n\nNo image here.\n",
    "pictured.md": "---\nimage: own.png\n---\n# Pictured\n",
    "blog/settings.md": "---\nfallback_image: ./blog-share.png\n---\n",
    "blog/post.md": "# Post\n"
  }, async (page) => {
    assert.match(head(await page("plain.html")), /<meta property=og:image content=\/share\.png>/)
    assert.match(head(await page("pictured.html")), /<meta property=og:image content=\/own\.png>/)
    assert.match(head(await page("blog/post.html")), /<meta property=og:image content=\/blog\/blog-share\.png>/, "a folder's own, relative to its settings.md")
  })
})

test("without a fallback_image, a page with no image has no og:image", async () => {
  await withSite({ "home.md": "# Home\n", "plain.md": "# Plain\n" }, async (page) => {
    assert.doesNotMatch(head(await page("plain.html")), /og:image/)
  })
})
