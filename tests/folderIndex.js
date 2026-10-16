import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { secretRouter } from "../secretPaths.js"

/** Where vowel's router puts a source path, as an output file. */
const routed = (source) => secretRouter(source).toLowerCase().replace(/\.md$/, ".html")

/**
 * Every folder with a listed page gets an index page - a `<folder>.md`
 * stub, routed to `<folder>.html` by the ordinary rule, so `/blog` is a
 * page. An author's own `<folder>.md` replaces it;
 * a folder with no listed page gets none. Spec: synthetic-sources.md,
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

    // The breadcrumb on a post links to the section now, and the nav lists
    // it - on the post, whose nav also lists the blog's own pages. The
    // homepage's would hold Blog alone, and a one-entry nav isn't rendered.
    const post = await html(path.join("blog", "post.html"))
    assert.match(post, /<nav aria-label=Breadcrumbs><a href=\/>Home<\/a><a href=\/blog>Blog<\/a>/)
    assert.match(post, /<header>.*href=\/blog>Blog<.*<\/header>/s)
    assert.doesNotMatch(await html("index.html"), /<header>.*<nav>.*<\/header>/s)
  })
})

test("an authored <folder>.md is the section index and the stub stands down; <folder>/index.md and <folder>/home.md are ordinary child pages", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog.md": "# My Blog\n\nHand-written.\n",
    "blog/post.md": "# Post\n",
    "shop/home.md": "# The Shop\n",
    "shop/hats.md": "# Hats\n",
    "notes/index.md": "# Just A Page\n\nCalled index.\n",
    "notes/one.md": "# One\n"
  }, async ({ html, pages, site }) => {
    assert.deepEqual((await pages()).filter(p => !p.includes(path.sep)), ["404.html", "blog.html", "index.html", "notes.html", "shop.html"])
    assert.match(await html("blog.html"), /<h1>My Blog<\/h1>/)
    assert.match(await html("blog.html"), /Hand-written/)
    assert.equal(site.database.target.get("blog.html").source, "blog.md")
    // Only the root's home.md has a rule (Sam, Sept 25): shop/home.md is
    // shop/home.html at /shop/home, listed by the generated shop.html.
    assert.match(await html(path.join("shop", "home.html")), /<h1>The Shop<\/h1>/)
    assert.equal(site.database.target.get(path.join("shop", "home.html")).metadata.prettyURL, "/shop/home")
    assert.equal(site.database.target.get("shop.html").source, "shop.md")
    assert.match(await html("shop.html"), /href=\/shop\/home/)
    // No special handling for index.md (Sam, Sept 19): notes/index.md is
    // notes/index.html at /notes/index, a child of the generated
    // notes.html, which lists it.
    assert.match(await html(path.join("notes", "index.html")), /Called index\./)
    assert.equal(site.database.target.get(path.join("notes", "index.html")).metadata.prettyURL, "/notes/index")
    assert.match(await html("notes.html"), /href=\/notes\/index/)
    assert.equal(site.database.target.get("notes.html").source, "notes.md")
  })
})

test("the tags folder keeps its own index; the index goes when the folder's last page does", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/post.md": "# Post\n\n#one\n"
  }, async ({ html, pages, sourceFolder, rebuild }) => {
    assert.match(await html("tags.html"), /<h1>Tags<\/h1>/)
    const all = await pages()
    assert.ok(all.includes("blog.html"))

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
    assert.equal(site.database.target.get("blog.html").source, "blog.md")
  })
})

test("a frontmatter tag gets a tag page and lists its page, like a hashtag", async () => {
  await withSite({
    "home.md": "# Home\n",
    "blog/post.md": "---\ntags: [design]\n---\n# Post\n\nNo hashtags here.\n"
  }, async ({ html }) => {
    const page = await html("tags/design.html")
    assert.ok(page, "tags/design.html exists")
    assert.match(page, /href="?\/blog\/post\b/, "the tag page links the page")
    assert.match(await html("tags.html"), /design/i)
  })
})

test("a secret folder gets its index at its hashed url: titled without the salt, listing its pages, listed nowhere, and its pages' breadcrumbs link to it", async () => {
  await withSite({
    "home.md": "# Home\n",
    "members##salt/welcome.md": "# Welcome\n",
    "members##salt/notes/first.md": "# First\n"
  }, async ({ html, pages }) => {
    const index = routed("members##salt.md")
    const nested = routed("members##salt/notes.md")
    assert.match(index, /^[0-9a-f]{16}\.html$/)
    const all = await pages()
    assert.ok(all.includes(index) && all.includes(nested), `both secret folders have an index: ${all}`)

    const page = await html(index)
    assert.match(page, /<h1>Members<\/h1>/, "titled by the folder's name, not its salt")
    assert.match(page, /href="?\/[0-9a-f]{16}\/welcome"?/, "it lists the folder's pages")
    for (const file of all) assert.ok(!(await html(file)).includes("salt"), `no salt in ${file}`)
    assert.ok(!(await html("index.html")).includes(index.replace(".html", "")), "the homepage doesn't list it")

    const welcome = await html(routed("members##salt/welcome.md"))
    assert.match(welcome, new RegExp(`<a href="?/${index.replace(".html", "")}"?>Members</a>`), "the breadcrumb links the index")
    const first = await html(routed("members##salt/notes/first.md"))
    assert.match(first, new RegExp(`<a href="?/${nested.replace(".html", "")}"?>Notes</a>`))
  })
})

test("a breadcrumb with nowhere to go is still an <a>, without an href", async () => {
  await withSite({
    "home.md": "# Home\n",
    "drafts/quiet.md": "---\nstatus: hidden\n---\n# Quiet\n"
  }, async ({ html, pages }) => {
    assert.ok(!(await pages()).includes("drafts.html"), "a folder with only a hidden page has no index")
    const quiet = await html("drafts/quiet.html")
    assert.match(quiet, /<a>Drafts<\/a>/)
    assert.ok(!/<span>Drafts<\/span>/.test(quiet))
  })
})
