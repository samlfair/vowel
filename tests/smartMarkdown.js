import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { emojiFor } from "../plugins/markdown/emoji.js"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-transform-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-transform-sys-"))
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
    const page = async (file) => readFile(path.join(targetFolder, file), "utf-8")
    await run({ site, sourceFolder, page, rebuild })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("emojiFor: canonical names win, keywords fall back, unknown is undefined", () => {
  assert.equal(emojiFor("grinning_face"), "😀")
  assert.equal(emojiFor("party_popper"), "🎉")
  assert.equal(emojiFor("tada"), "🎉")
  assert.equal(emojiFor("+1"), "👍")
  assert.equal(emojiFor("womp-womp"), undefined)
})

test("wikilinks: resolved by name across folders, with section and label; unresolved is an <a> with no href; recorded as links", async () => {
  await withSite({
    "home.md": "# Home\n",
    "notes/Hello World.md": "# Hello World\n\n## Second Part\n\nText.\n",
    "post.md": "# Post\n\nSee [[Hello World]], [[Hello World#Second Part]], [[hello world|the words]] and [[Nowhere]].\n"
  }, async ({ site, page }) => {
    const html = await page("post.html")
    // The element carries what it was made from (data-note, data-section)
    // so the write can resolve it again and the editor can put [[...]] back.
    assert.match(html, /<a class=wikilink data-note="Hello World"href=\/notes\/hello-world>Hello World<\/a>/)
    assert.match(html, /<a class=wikilink data-note="Hello World"data-section="Second Part"href=\/notes\/hello-world#second-part>Hello World<\/a>/)
    assert.match(html, /<a class=wikilink data-note="hello world"href=\/notes\/hello-world>the words<\/a>/)
    assert.match(html, /<a class=wikilink data-note=Nowhere>Nowhere<\/a>/)

    // Recorded by the note's key: the filename, lowercased.
    assert.ok(site.database.target.get("post.html").metadata.links.includes("[[hello world]]"))
    // And the linked page lists it as a backlink.
    const linked = await page(path.join("notes", "hello-world.html"))
    assert.match(linked, /<section id=backlinks>[\s\S]*Post[\s\S]*<\/section>/)
  })
})

test("wikilinks: a note appearing later resolves the link on the next build", async () => {
  await withSite({
    "home.md": "# Home\n",
    "post.md": "# Post\n\n[[Later]]\n"
  }, async ({ sourceFolder, page, rebuild }) => {
    assert.match(await page("post.html"), /<a class=wikilink data-note=Later>Later<\/a>/)
    await writeFile(path.join(sourceFolder, "later.md"), "# Later\n")
    await rebuild({ changed: ["later.md"] })
    assert.match(await page("post.html"), /<a class=wikilink data-note=Later href=\/later>Later<\/a>/)
  })
})

test("wikilinks: two notes with one name - the nearest wins: own folder, then the longest shared folder prefix, then the shortest path", async () => {
  await withSite({
    "home.md": "# Home\n",
    "a/Note.md": "# Note\n",
    "b/c/Note.md": "# Note\n",
    "b/c/post.md": "# Post\n\n[[Note]]\n",
    "b/deep/deeper/post.md": "# Post\n\n[[Note]] and [[a/note]]\n",
    "other.md": "# Other\n\n[[Note]]\n"
  }, async ({ page }) => {
    assert.match(await page(path.join("b", "c", "post.html")), /href=\/b\/c\/note>/)
    // From b/deep/deeper: b/c/note shares `b`, a/note shares nothing.
    assert.match(await page(path.join("b", "deep", "deeper", "post.html")), /data-note=Note href=\/b\/c\/note>/)
    // A path narrows it, Obsidian-style: [[a/note]] is the one under a/.
    assert.match(await page(path.join("b", "deep", "deeper", "post.html")), /data-note=a\/note href=\/a\/note>/)
    assert.match(await page("other.html"), /href=\/a\/note>/)
  })
})

test("wikilinks: case-insensitive on the filename, and an alias reaches a note too", async () => {
  await withSite({
    "home.md": "# Home\n",
    "notes/iPhone Notes.md": "---\naliases: [phone, Mobile]\n---\n\n# iPhone Notes\n",
    "post.md": "# Post\n\n[[iphone notes]] [[IPHONE NOTES]] [[Phone]] [[mobile]] [[hello-world]]\n",
    "hello-world.md": "# Hello World\n"
  }, async ({ page, site }) => {
    const html = await page("post.html")
    assert.equal((html.match(/href=\/notes\/iphone-notes>/g) ?? []).length, 4)
    // Obsidian matches the filename, not the title: hello-world.md is
    // reached as [[hello-world]], and would not be as [[Hello World]].
    assert.match(html, /data-note=hello-world href=\/hello-world>/)
    // Backlinks reach the note under its alias.
    const linked = await page(path.join("notes", "iphone-notes.html"))
    assert.match(linked, /<section id=backlinks>[\s\S]*Post[\s\S]*<\/section>/)
  })
})

test("shortcodes: an emoji becomes the character, an icon becomes an image from the project, unknown stays literal, code is untouched", async () => {
  await withSite({
    "home.md": "# Home\n",
    "fa/surfer.svg": "<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor'></svg>",
    "post.md": "# Post\n\nHello :tada: and :fa/surfer: but :womp-womp: and :fa/missing: stay, `:tada:` too.\n"
  }, async ({ page }) => {
    const html = await page("post.html")
    assert.match(html, /Hello 🎉 and <img class=icon data-icon=fa\/surfer alt=surfer src=\/fa\/surfer.svg style='--icon-url: url\(&#34\/fa\/surfer.svg&#34\)'> but :womp-womp: and :fa\/missing: stay, <code>:tada:<\/code> too\./)
  })
})

test("the table of contents carries no generated class names", async () => {
  await withSite({
    "home.md": "# Home\n",
    "post.md": "# Post\n\n## One\n\n### Deeper\n\n## Two\n"
  }, async ({ page }) => {
    const html = await page("post.html")
    const contents = html.match(/<nav aria-label=Contents>([\s\S]*?)<\/nav>/)?.[1]
    assert.ok(contents, "a contents nav")
    assert.ok(!/class=/.test(contents), `no classes in the contents: ${contents}`)
    assert.match(contents, /<ol><li><a href=#one>One<\/a><ol><li><a href=#deeper>Deeper<\/a><\/ol><li><a href=#two>Two<\/a><\/ol>/)
  })
})
