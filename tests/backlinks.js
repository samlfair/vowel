import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { normalizeLink, collectLinks } from "../plugins/markdown/links.js"
import { readWalk } from "../plugins/markdown/readRules.js"
import { fromMarkdown } from "mdast-util-from-markdown"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-backlinks-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-backlinks-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) {
      const full = path.join(sourceFolder, rel)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder, databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"), logging: "silent", urlHostInterval: 0
    }))
    const rebuild = async (scope) => { await (await site.build(scope)).deferred }
    await rebuild()
    const backlinksOf = async (file) => {
      const html = await readFile(path.join(targetFolder, file), "utf-8")
      const section = html.match(/<section id=backlinks>([\s\S]*?)<\/section>/)?.[1]
      if (!section) return null
      return [...section.matchAll(/<a href=([^\s>]+)>([^<]*)</g)].map(m => m[2])
    }
    await run({ sourceFolder, site, rebuild, backlinksOf })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("normalizeLink: ./ becomes a source path, / a target url, everything else is not a link", () => {
  assert.equal(normalizeLink("./post.md", path.join("blog", "index.md")), path.join("blog", "post.md"))
  assert.equal(normalizeLink("../about.md", path.join("blog", "index.md")), "about.md")
  assert.equal(normalizeLink("/blog/post", "x.md"), "/blog/post")
  assert.equal(normalizeLink("/blog/post.html#top", "x.md"), "/blog/post")
  assert.equal(normalizeLink("/blog/", "x.md"), "/blog")
  assert.equal(normalizeLink("./notes%23%23salt.md", "x.md"), "notes##salt.md", "decoded, so a secret link matches its source path")
  assert.equal(normalizeLink("./notes##salt.md#top", "x.md"), "notes##salt.md", "the extension, not the first #, ends a source path")
  assert.equal(normalizeLink("./post.md#top", "x.md"), "post.md")
  assert.equal(normalizeLink("/blog/**", "x.md"), null, "a glob lists pages; it does not link to them")
  assert.equal(normalizeLink("https://example.com", "x.md"), null)
  assert.equal(normalizeLink("#top", "x.md"), null)
  assert.equal(normalizeLink("//cdn.example.com/x", "x.md"), null)
})

test("collectLinks: markdown links, bare references and frontmatter links; not globs, externals or fragments", () => {
  const tree = fromMarkdown("See [a](./a.md) and [b](/blog/b) and [x](https://x.com) and [t](#top).\n\n/blog/**\n\n/blog/ref\n")
  // The tree's links come from the read walk; collectLinks adds the frontmatter's.
  const walked = { filePath: "index.md", tags: [], links: [] }
  readWalk(tree, walked)
  assert.deepEqual(walked.links, ["a.md", "/blog/b", "/blog/ref"])
  const metadata = { frontmatter_keys: ["related", "image", "tags"], fm_related: "./c.md", fm_image: "/pic.jpg", fm_tags: ["one"] }
  assert.deepEqual(collectLinks(walked.links, metadata, "index.md"), ["a.md", "/blog/b", "/blog/ref", "c.md", "/pic.jpg"])
})

test("a page lists the pages that explicitly link to it, and only those", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "blog/target.md": "# Target\n\nThe page being linked to.",
    "blog/by-relative.md": "# By relative\n\nSee [the target](./target.md).",
    "by-absolute.md": "# By absolute\n\nSee [the target](/blog/target).",
    "by-frontmatter.md": "---\nrelated: /blog/target\n---\n\n# By frontmatter\n\nNothing in the body.",
    "by-reference.md": "# By reference\n\n/blog/target",
    "by-glob.md": "# By glob\n\n/blog/**"
  }, async ({ backlinksOf }) => {
    const names = await backlinksOf(path.join("blog", "target.html"))
    assert.deepEqual(names.sort(), ["By absolute", "By frontmatter", "By reference", "By relative"], "the glob page and the home listing are not backlinks")
    assert.equal(await backlinksOf(path.join("blog", "by-relative.html")), null, "a page nothing links to has no section")
  })
})

test("losing a link removes the backlink on an incremental build; gaining one adds it", async () => {
  await withSite({
    "home.md": "# Home",
    "target.md": "# Target\n\nText.",
    "linker.md": "# Linker\n\nSee [it](./target.md)."
  }, async ({ sourceFolder, rebuild, backlinksOf }) => {
    assert.deepEqual(await backlinksOf("target.html"), ["Linker"])

    await writeFile(path.join(sourceFolder, "linker.md"), "# Linker\n\nNo link now.")
    await rebuild({ changed: ["linker.md"], deleted: [] })
    assert.equal(await backlinksOf("target.html"), null, "the target restaled because a page's `links` changed")

    await writeFile(path.join(sourceFolder, "linker.md"), "# Linker\n\nBack: [it](/target).")
    await rebuild({ changed: ["linker.md"], deleted: [] })
    assert.deepEqual(await backlinksOf("target.html"), ["Linker"])
  })
})

test("a secret page gets its backlink by source path, and the referrer's page keeps the salt out", async () => {
  await withSite({
    "home.md": "# Home",
    "notes##salt.md": "# Secret notes\n\nShh.",
    "linker.md": "# Linker\n\nSee [my notes](./notes##salt.md)."
  }, async ({ backlinksOf, sourceFolder }) => {
    const { hashSegmentInput } = await import("../secretPaths.js")
    assert.deepEqual(await backlinksOf(`${hashSegmentInput("notes##salt")}.html`), ["Linker"])
  })
})
