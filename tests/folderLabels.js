import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { fromMarkdown } from "mdast-util-from-markdown"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import getMetadata from "../plugins/markdown/metadata.js"

/**
 * A folder's label, in the navs, the breadcrumb trail and `<title>`, is
 * its index page's `breadcrumb`: the page's `breadcrumb:`, else its
 * title, else (no index page) the folder's name. A settings.md labels
 * nothing: `name:` is the site's, read at the root only.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-labels-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-labels-sys-"))
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
    const page = (file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8")
    await run({ site, sourceFolder, page })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const header = (html) => html.match(/<header>[\s\S]*?<\/header>/)[0]
const aside = (html) => html.match(/<aside>[\s\S]*?<\/aside>/)[0]
const crumbs = (html) => html.match(/<nav aria-label=Breadcrumbs>[\s\S]*?<\/nav>/)[0]
const title = (html) => html.match(/<title>([^<]*)<\/title>/)[1]

const files = {
  "settings.md": "---\nname: Site\n---\n",
  "home.md": "# Home\n",
  "about.md": "# About\n",
  // The index page's breadcrumb: labels the folder; its title doesn't.
  "blog.md": "---\nbreadcrumb: Posts\n---\n# Everything I've written\n",
  "blog/post.md": "# Hello\n",
  // A subfolder's settings.md labels nothing, breadcrumb: or name:.
  "blog/settings.md": "---\nbreadcrumb: Articles\nname: Writing\n---\n",
  // No breadcrumb: the index page's title.
  "shop.md": "# Store\n",
  "shop/hats.md": "# Hats\n",
  "shop/hats/red.md": "# Red\n",
  // No index page: the generated one, titled by the folder's name.
  "plain/a.md": "# A\n",
  "plain/settings.md": "---\nname: Ignored\n---\n"
}

test("a page's own breadcrumb: is kept, not replaced by its title", () => {
  const tree = fromMarkdown("---\nbreadcrumb: Short\n---\n\n# A Long Title\n\nText.\n", {
    extensions: [frontmatter()],
    mdastExtensions: [frontmatterFromMarkdown()]
  })
  const metadata = getMetadata(tree, path.join("blog", "post.md"), path.join("blog", "post.html"))
  assert.equal(metadata.breadcrumb, "Short")
  assert.equal(metadata.fm_breadcrumb, "Short")
  assert.equal(metadata.title, "A Long Title")
})

test("a settings.md that declares no breadcrumb contributes none", async () => {
  await withSite(files, async ({ site }) => {
    const root = site.database.setting.getByFolder("")
    assert.equal(root.breadcrumb, undefined, "the root's settings.md named itself Settings")
    assert.equal(root.fm_breadcrumb, undefined)
  })
})

test("the header nav and the aside label a folder by its index page: breadcrumb:, else title, else the folder's name", async () => {
  await withSite(files, async ({ page }) => {
    const about = await page("about.html")
    for (const [folder, label] of [["blog", "Posts"], ["shop", "Store"], ["plain", "Plain"]]) {
      assert.match(header(about), new RegExp(`<a href=/${folder}>${label}</a>`), `header: ${folder}`)
      assert.match(aside(about), new RegExp(`<a href=/${folder}\\.html>${label}</a>`), `aside: ${folder}`)
    }
    for (const ignored of ["Articles", "Writing", "Ignored"]) {
      assert.ok(!header(about).includes(ignored), `header: ${ignored}`)
      assert.ok(!aside(about).includes(ignored), `aside: ${ignored}`)
    }
  })
})

test("the breadcrumb trail labels each folder the same way", async () => {
  await withSite(files, async ({ page }) => {
    assert.match(crumbs(await page("blog/post.html")), /<a href=\/blog>Posts<\/a>/)
    const red = crumbs(await page("shop/hats/red.html"))
    assert.match(red, /<a href=\/shop>Store<\/a>/)
    assert.match(red, /<a href=\/shop\/hats>Hats<\/a>/)
    assert.match(crumbs(await page("plain/a.html")), /<a href=\/plain>Plain<\/a>/)
  })
})

test("<title> is the page, each folder by its index page, then the root's name:", async () => {
  await withSite(files, async ({ page }) => {
    assert.equal(title(await page("blog/post.html")), "Hello - Posts - Site")
    assert.equal(title(await page("shop/hats/red.html")), "Red - Hats - Store - Site")
    assert.equal(title(await page("plain/a.html")), "A - Plain - Site")
  })
})

test("editing an index page's breadcrumb: relabels the folder in the navs, the trail and <title>", async () => {
  await withSite(files, async ({ site, sourceFolder, page }) => {
    await writeFile(path.join(sourceFolder, "blog.md"), "---\nbreadcrumb: Journal\n---\n# Everything I've written\n")
    await (await site.build({ changed: ["blog.md"] })).deferred

    const about = await page("about.html")
    assert.match(header(about), /<a href=\/blog>Journal<\/a>/)
    assert.match(aside(about), /<a href=\/blog\.html>Journal<\/a>/)
    const post = await page("blog/post.html")
    assert.match(crumbs(post), /<a href=\/blog>Journal<\/a>/)
    assert.equal(title(post), "Hello - Journal - Site")
  })
})
