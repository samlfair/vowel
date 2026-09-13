import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { secretRouter, isSecretPath, hashSegment } from "../secretPaths.js"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-secret-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-secret-sys-"))
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
    const rebuild = async () => { await (await site.build()).deferred }
    await rebuild()
    await run({ sourceFolder, targetFolder, site, rebuild })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("secretRouter: hashes a leading-dash segment and leaves everything else alone", () => {
  assert.equal(secretRouter("about.md"), "about.md")
  assert.equal(secretRouter("a-b/c-d.md"), "a-b/c-d.md", "a dash inside a name is not a marker")
  assert.equal(secretRouter("blog/-key/hello.md"), `blog/${hashSegment("key")}/hello.md`)
  assert.equal(secretRouter("-notes.md"), `${hashSegment("notes")}.md`, "the extension survives, so the file still routes")
  assert.equal(secretRouter("blog/-key/sub/deep.png"), `blog/${hashSegment("key")}/sub/deep.png`)
})

test("secretRouter: the digest is lowercase, because stored target paths are canonicalized that way", () => {
  const hashed = secretRouter("-x/y.md")
  assert.equal(hashed, hashed.toLowerCase())
})

test("isSecretPath: true for any secret segment, folder or file", () => {
  assert.equal(isSecretPath("blog/-key/hello.md"), true)
  assert.equal(isSecretPath("-notes.md"), true)
  assert.equal(isSecretPath("blog/post.md"), false)
  assert.equal(isSecretPath("a-b/c.md"), false)
})

test("a secret page is published only at its hashed path, and every listing omits it", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\ntitle: T\n---\n",
    "home.md": "# Home\n\n/**",
    "blog/post.md": "# Public post\n\nVisible.",
    "blog/-wayne/hello.md": "# Secret page\n\nShh."
  }, async ({ targetFolder, site }) => {
    const hashed = hashSegment("wayne")

    const secret = await readFile(path.join(targetFolder, "blog", hashed, "hello.html"), "utf-8")
    assert.match(secret, /<h1>Secret page<\/h1>/)

    assert.equal(site.database.target.get(path.join("blog", "-wayne", "hello.html")), undefined,
      "nothing is published at the public path")

    // The folder name and the hash must both be absent from everything a
    // visitor can reach without already knowing the URL.
    for (const file of ["index.html", "sitemap.xml", "feed.xml", "blog/post.html"]) {
      const html = await readFile(path.join(targetFolder, file), "utf-8")
      assert.equal(html.includes("wayne"), false, `${file} leaks the folder name`)
      assert.equal(html.includes(hashed), false, `${file} leaks the secret URL`)
      assert.equal(html.includes("Secret page"), false, `${file} leaks the page`)
    }
  })
})

test("an asset in a secret folder is hashed too - the rule is above the processors", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "-drafts/notes.md": "# Draft\n\nWIP.",
    "-drafts/robots.txt": "User-agent: *"
  }, async ({ site }) => {
    const hashed = hashSegment("drafts")
    const paths = site.database.target.getAll().map(target => target.path)

    assert.ok(paths.includes(`${hashed}/robots.txt`),
      "a .txt is routed by a different processor and must still be hashed")
    assert.equal(paths.some(p => p.includes("drafts")), false,
      "nothing anywhere is published under the readable folder name")
  })
})

test("renaming a secret segment removes the old output", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "-drafts/notes.md": "# Draft\n\nWIP."
  }, async ({ sourceFolder, targetFolder, site, rebuild }) => {
    const oldHash = hashSegment("drafts")
    await readFile(path.join(targetFolder, oldHash, "notes.html"), "utf-8")

    await rm(path.join(sourceFolder, "-drafts"), { recursive: true, force: true })
    await mkdir(path.join(sourceFolder, "-secret"), { recursive: true })
    await writeFile(path.join(sourceFolder, "-secret", "notes.md"), "# Draft\n\nWIP.")
    await rebuild()

    await assert.rejects(() => readFile(path.join(targetFolder, oldHash, "notes.html"), "utf-8"),
      "a rename is a delete plus an add, so the old file goes")
    await readFile(path.join(targetFolder, hashSegment("secret"), "notes.html"), "utf-8")
  })
})

test("secret_key frontmatter is now an ordinary property and publishes nothing secretly", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "page.md": "---\nsecret_key: dog\n---\n\n# Ordinary\n\nText."
  }, async ({ site }) => {
    const paths = site.database.target.getAll().map(target => target.path)
    assert.ok(paths.includes("page.html"), "it is published at its public path like any page")
    assert.equal(paths.length, new Set(paths).size)
    assert.equal(paths.some(p => /^[0-9a-f]{32}\.html$/.test(p)), false, "no hashed shadow target is created")
  })
})
