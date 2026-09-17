import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * Every folder with a listed page gets an index page - `<folder>/index.md`,
 * a stub, routed to `<folder>.html` the way `<folder>/home.md` is, so
 * `/blog` is a page. An author's own index.md or home.md replaces it; a
 * folder with no listed page gets none. Spec: synthetic-sources.md,
 * "a folder with no listed markdown page gets no index".
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-folder-index-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-folder-index-sys-"))
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
    const rebuild = async (scope) => { await (await site.build(scope)).deferred }
    await rebuild()
    const html = async (file) => {
      try { return await readFile(path.join(targetFolder, file), "utf-8") } catch { return null }
    }
    const pages = async () => (await readdir(targetFolder, { recursive: true })).filter(f => f.endsWith(".html")).sort()
    await run({ site, sourceFolder, targetFolder, html, pages, rebuild })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("a folder with a page gets an index at <folder>.html listing it; an empty folder and an asset-only folder get none", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/post.md": "# Post\n\nText.\n",
    "blog/2026/note.md": "# Note\n",
    "images/pic.svg": "<svg xmlns='http://www.w3.org/2000/svg'></svg>"
  }, async ({ html, pages, sourceFolder }) => {
    await mkdir(path.join(sourceFolder, "empty"), { recursive: true })
    assert.deepEqual(await pages(), ["404.html", "blog.html", path.join("blog", "2026.html"), path.join("blog", "2026", "note.html"), path.join("blog", "post.html"), "index.html"].sort())

    const blog = await html("blog.html")
    assert.match(blog, /<h1>Blog<\/h1>/)
    assert.match(blog, /href=\/blog\/post/, "lists the post")
    assert.match(blog, /href=\/blog\/2026/, "lists the nested section's index")
    const content = blog.match(/<section id=content>.*?<\/section>/s)[0]
    assert.ok(!content.includes("href=/blog/2026/note"), "not recursive: the nested note is the nested index's to list")
    assert.ok(!content.includes("/blog/2026/*"), "a section's directive is not its description")

    // The breadcrumb on a post links to the section now, and the nav lists it.
    const post = await html(path.join("blog", "post.html"))
    assert.match(post, /<nav aria-label=Breadcrumbs><a href=\/>Home<\/a><a href=\/blog>Blog<\/a>/)
    assert.match(await html("index.html"), /<header>.*href=\/blog>Blog<.*<\/header>/s)
  })
})

test("an authored <folder>/index.md or <folder>/home.md is the section index; the stub stands down", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/index.md": "# My Blog\n\nHand-written.\n",
    "blog/post.md": "# Post\n",
    "shop/home.md": "# The Shop\n",
    "shop/hats.md": "# Hats\n"
  }, async ({ html, pages }) => {
    assert.deepEqual((await pages()).filter(p => !p.includes(path.sep)), ["404.html", "blog.html", "index.html", "shop.html"])
    assert.match(await html("blog.html"), /<h1>My Blog<\/h1>/)
    assert.match(await html("blog.html"), /Hand-written/)
    assert.match(await html("shop.html"), /<h1>The Shop<\/h1>/)
  })
})

test("the tags folder keeps its own index; a secret folder gets none; the index goes when the folder's last page does", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/post.md": "# Post\n\n#one\n",
    "hidden##salt/secret.md": "# Secret\n"
  }, async ({ html, pages, sourceFolder, rebuild }) => {
    assert.match(await html("tags.html"), /<h1>Tags<\/h1>/)
    const all = await pages()
    assert.ok(all.includes("blog.html"))
    assert.ok(!all.some(p => /^[0-9a-f]{16}\.html$/.test(p)), `no index for the secret folder: ${all}`)

    await rm(path.join(sourceFolder, "blog", "post.md"))
    await rebuild({ deleted: [path.join("blog", "post.md")] })
    assert.equal(await html("blog.html"), null, "the index went with the folder's last page")
    assert.equal(await html("tags.html"), null)
  })
})

test("a second build with nothing changed writes no folder index again", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/post.md": "# Post\n"
  }, async ({ site, rebuild }) => {
    await rebuild()
    const stale = site.database.raw.prepare("SELECT path FROM targets WHERE stale = 1").all()
    assert.deepEqual(stale, [])
    assert.equal(site.database.target.get("blog.html").source, path.join("blog", "index.md"))
  })
})
