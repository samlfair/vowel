import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, rm, access, utimes } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { coerce } from "../plugins/markdown/frontmatter.js"

/** A project built once; `read` gives an output file's text, or undefined when it isn't there. */
async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-status-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-status-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const errors = []
  const site = await votive(createConfig(sourceFolder, {
    targetFolder,
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent",
    urlHostInterval: 0,
    log: (level, message) => { if (level === "error") errors.push(message) }
  }))
  try {
    for (const [relative, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, relative)), { recursive: true })
      await writeFile(path.join(sourceFolder, relative), body)
    }
    const build = async () => { await (await site.build({ defer: false })).deferred }
    await build()
    const read = (relative) => readFile(path.join(targetFolder, relative), "utf-8").catch(() => undefined)
    const exists = (relative) => access(path.join(targetFolder, relative)).then(() => true, () => false)
    await run({ sourceFolder, build, read, exists, errors, site })
  } finally {
    await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const FILES = {
  "settings.md": "---\nname: T\ndomain: example.com\n---\n",
  "blog/live.md": "---\ndate: 2026-03-01\n---\n# Live\n\nSee [[quiet]], [[gone]] and [[sketch]].\n",
  "blog/quiet.md": "---\ndate: 2026-03-02\nstatus: hidden\n---\n# Quiet\n\nOnly here. #secretive\n",
  "blog/gone.md": "---\ndate: 2026-03-03\nstatus: deleted\n---\n# Gone\n\n#vanished\n",
  "blog/sketch.md": "---\ndate: 2026-03-04\nstatus: draft\n---\n# Sketch\n",
  "listing.md": "# Listing\n\n./blog/*\n"
}

test("status: published is written and listed; hidden is written and listed nowhere; draft and deleted are not written", async () => {
  await withSite(FILES, async ({ read, exists }) => {
    assert.ok(await exists("blog/live.html"))
    assert.ok(await exists("blog/quiet.html"), "a hidden page is still a page, at its url")
    assert.equal(await exists("blog/gone.html"), false)
    assert.equal(await exists("blog/sketch.html"), false)

    const index = await read("blog.html")
    const sitemap = await read("sitemap.xml")
    const feed = await read("feed.xml")
    const listing = await read("listing.html")
    for (const page of ["quiet", "gone", "sketch"]) assert.ok(!sitemap.includes(`/blog/${page}`), `the sitemap doesn't list ${page}`)
    assert.ok(sitemap.includes("/blog/live"))
    // By title: the published post links the hidden one in its body, which
    // the feed carries, so the url alone would be there.
    for (const [name, text] of Object.entries({ index, feed, listing })) {
      assert.ok(text.includes("Live"), `${name} lists the published page`)
      for (const title of ["Quiet", "Gone", "Sketch"]) assert.ok(!text.includes(title), `${name} doesn't list ${title}`)
    }
    assert.equal(await exists("tags/vanished.html"), false, "a deleted page's tag makes no tag page")
  })
})

test("status: a wikilink finds a hidden page, not a deleted or draft one", async () => {
  await withSite(FILES, async ({ read }) => {
    const live = await read("blog/live.html")
    assert.match(live, /<a[^>]*href="?\/blog\/quiet"?[^>]*>quiet<\/a>/)
    assert.match(live, /<a class="?wikilink"? data-note="?gone"?>gone<\/a>/, "unresolved: no href")
    assert.match(live, /<a class="?wikilink"? data-note="?sketch"?>sketch<\/a>/)
  })
})

test("status: a page set to deleted or draft takes its file with it; back to published brings it back", async () => {
  await withSite({ "settings.md": FILES["settings.md"], "post.md": "# Post\n" }, async ({ sourceFolder, build, exists }) => {
    // An edit within the same mtime tick is not an edit; each one moves
    // the clock on.
    const edit = async (text, seconds) => {
      const file = path.join(sourceFolder, "post.md")
      await writeFile(file, text)
      const when = new Date(Date.now() + seconds * 1000)
      await utimes(file, when, when)
    }
    assert.ok(await exists("post.html"))
    await edit("---\nstatus: deleted\n---\n# Post\n", 10)
    await build()
    assert.equal(await exists("post.html"), false)
    await edit("---\nstatus: draft\n---\n# Post\n", 20)
    await build()
    assert.equal(await exists("post.html"), false)
    await edit("# Post\n", 30)
    await build()
    assert.ok(await exists("post.html"))
  })
})

test("status: case doesn't matter; any other value is the author's own (a garden's \"evergreen\"), kept and published", () => {
  const problems = []
  const read = (value) => coerce({ status: value }, "post.md", "", message => problems.push(message)).status
  assert.equal(read("Hidden"), "hidden")
  assert.equal(read("draft"), "draft")
  assert.equal(read("evergreen"), "evergreen")
  assert.equal(read("growing"), "growing")
  assert.deepEqual(problems, [], "nothing to warn about")
})

test("status: the author's own value is shown with the page's frontmatter; vowel's own isn't", async () => {
  await withSite({
    "settings.md": FILES["settings.md"],
    "garden.md": "---\nstatus: evergreen\n---\n# Garden\n",
    "quiet.md": "---\nstatus: hidden\n---\n# Quiet\n"
  }, async ({ read }) => {
    const garden = await read("garden.html")
    assert.ok(garden, "an unknown status is published")
    assert.match(garden, /evergreen/)
    assert.ok(!(await read("quiet.html")).includes(">hidden<"), "an instruction isn't content")
  })
})
