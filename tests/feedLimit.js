import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-feed-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-feed-sys-"))
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
    await run({ sourceFolder, targetFolder, site })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

/** Thirty dated posts, newest last by number. */
function posts(count) {
  return Object.fromEntries(Array.from({ length: count }, (_, i) => {
    const day = String(i + 1).padStart(2, "0")
    return [`blog/post-${day}.md`, `# Post ${day}\n\n2026-01-${day}\n\nBody ${day}.`]
  }))
}

const entries = (xml) => [...xml.matchAll(/<title>Post (\d\d)<\/title>/g)].map(m => m[1])

test("feed.xml carries the twenty most recent entries by default, newest first", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\nname: T\n---\n",
    ...posts(30)
  }, async ({ targetFolder }) => {
    const feed = await readFile(path.join(targetFolder, "feed.xml"), "utf-8")
    const listed = entries(feed)
    assert.equal(listed.length, 20)
    assert.equal(listed[0], "30")
    assert.equal(listed.at(-1), "11")
  })
})

test("feed_limit in settings.md sets the count", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\nname: T\nfeed_limit: 5\n---\n",
    ...posts(30)
  }, async ({ targetFolder }) => {
    const feed = await readFile(path.join(targetFolder, "feed.xml"), "utf-8")
    assert.deepEqual(entries(feed), ["30", "29", "28", "27", "26"])
  })
})

test("editing a post outside the feed's window leaves feed.xml alone", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\nname: T\n---\n",
    ...posts(30)
  }, async ({ sourceFolder, site }) => {
    await writeFile(path.join(sourceFolder, "blog/post-01.md"), "# Post 01\n\n2026-01-01\n\nChanged.")
    await site.build({ changed: ["blog/post-01.md"] })
    // The feed read every post's date to order them, but only the
    // twenty it rendered read `data`; an old post's body is not its
    // concern. (getStale is consulted before the write pass clears it,
    // so ask the dependency table instead.)
    const edges = site.database.dependency.getAllByTarget("blog/post-01.html").filter(row => row.dependent === "feed.xml").map(row => row.property)
    assert.equal(edges.includes("data"), false)
    assert.equal(edges.includes("date"), true)
  })
})
