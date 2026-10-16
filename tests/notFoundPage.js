import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * The site's 404 page is written but listed nowhere, generated or the
 * author's own: no glob listing, menu, sitemap or feed names it. It used
 * to show up in `/*` listings and in sitemap.xml.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-404-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-404-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
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
    await run((file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const site = {
  "settings.md": "---\ndomain: example.com\n---\n",
  "home.md": "# Home\n\n/*\n",
  "about.md": "# About\n",
  "contact.md": "# Contact\n"
}

const content = (html) => html.match(/<section id=content>[\s\S]*?<\/section>/)[0]

for (const [kind, files] of [
  ["the generated 404", site],
  ["an author's own 404.md", { ...site, "404.md": "# Lost\n\nNothing here.\n" }]
]) {
  test(`${kind} is written, and no listing, menu or sitemap names it`, async () => {
    await withSite(files, async (page) => {
      const notFound = await page("404.html")
      assert.match(notFound, /<h1>(Page not found|Lost)<\/h1>/, "it is still written")

      const home = await page("index.html")
      assert.match(content(home), /href=\/about/, "the listing works")
      assert.doesNotMatch(content(home), /href=\/404/, "the listing")
      assert.doesNotMatch(home, /<header>[\s\S]*href=\/404[\s\S]*<\/header>/, "the header nav")
      assert.doesNotMatch(home, /<aside>[\s\S]*404[\s\S]*<\/aside>/, "the aside")
      assert.doesNotMatch(await page("sitemap.xml"), /404/, "the sitemap")
    })
  })
}

test("a 404.md below the root is an ordinary page", async () => {
  await withSite({ ...site, "blog/404.md": "# Four oh four\n", "blog/post.md": "# Post\n", "blog.md": "# Blog\n\n/blog/*\n" }, async (page) => {
    assert.match(content(await page("blog.html")), /href=\/blog\/404/)
  })
})
