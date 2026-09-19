import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { secretRouter, isSecretPath, displayPath, saltsIn, hashSegmentInput } from "../secretPaths.js"

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

/** Every file under the output folder, as [relative path, text]. */
async function outputFiles(targetFolder) {
  const entries = await readdir(targetFolder, { withFileTypes: true, recursive: true })
  return Promise.all(entries.filter(e => e.isFile()).map(async e => {
    const full = path.join(e.parentPath, e.name)
    return [path.relative(targetFolder, full), await readFile(full, "latin1")]
  }))
}

test("secretRouter: hashes the whole segment, keeps the extension, leaves everything else alone", () => {
  assert.equal(secretRouter("about.md"), "about.md")
  assert.equal(secretRouter("blog/hidden##purple-bear/post.md"), `blog/${hashSegmentInput("blog/hidden##purple-bear")}/post.md`)
  assert.equal(secretRouter("hello-world##red-whale.md"), `${hashSegmentInput("hello-world##red-whale.md")}.md`)
  assert.equal(secretRouter("reports/dev##blue-parrot.md"), `reports/${hashSegmentInput("reports/dev##blue-parrot.md")}.md`)
})

test("secretRouter: the hash input is the original path up to the segment, salt in place - frozen", () => {
  // Pinned values. If this test ever fails, every secret URL on every
  // site has rotated, so the change had better be deliberate.
  assert.equal(secretRouter("blog/hidden##purple-bear/post.md"), "blog/ecc3ddccc8af2f3e/post.md")
  assert.equal(secretRouter("hello-world##red-whale.md"), "70cc08f63f1d07ba.md")
})

test("secretRouter: a nested secret hashes against the original path, not the rewritten parent", () => {
  const folder = hashSegmentInput("a##b")
  const file = hashSegmentInput("a##b/c##d.png")
  assert.equal(secretRouter("a##b/c##d.png"), `${folder}/${file}.png`)
})

test("secretRouter: the digest is lowercase and sixteen hex characters", () => {
  const segment = secretRouter("x##y.md").slice(0, -3)
  assert.match(segment, /^[0-9a-f]{16}$/)
})

test("secretRouter: malformed markers throw naming the path, rather than guessing", () => {
  assert.throws(() => secretRouter("##salt.md"), /##salt\.md/)
  assert.throws(() => secretRouter("name##.md"), /name##\.md/)
  assert.throws(() => secretRouter("a##b##c.md"), /a##b##c\.md/)
  assert.throws(() => secretRouter("a###b.md"), /a###b\.md/, "a third # glued on is not a salt starting with #")
  assert.equal(secretRouter("notes#1.md"), "notes#1.md", "a lone # is not a marker")
  assert.throws(() => secretRouter("folder/x ##y.md"), /x ##y\.md/)
})

test("displayPath and saltsIn: the name survives, the salt is separable", () => {
  assert.equal(displayPath("blog/hidden##purple-bear/post.md"), "blog/hidden/post.md")
  assert.equal(displayPath("hello-world##red-whale.md"), "hello-world.md")
  assert.equal(displayPath("plain.md"), "plain.md")
  assert.deepEqual(saltsIn("a##b/c##d.png"), ["b", "d"])
  assert.equal(isSecretPath("a##b/c.md"), true)
  assert.equal(isSecretPath("a-b/c.md"), false)
})

test("a secret page is published only at its hashed path, and every listing omits it", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\nname: T\n---\n",
    "home.md": "# Home\n\n/**",
    "blog/post.md": "# Public post\n\nVisible.",
    "blog/hidden##purple-bear/hello.md": "# Secret page\n\nShh."
  }, async ({ targetFolder, site }) => {
    const hashed = hashSegmentInput("blog/hidden##purple-bear")

    const secret = await readFile(path.join(targetFolder, "blog", hashed, "hello.html"), "utf-8")
    assert.match(secret, /<h1>Secret page<\/h1>/)

    const paths = site.database.target.getAll().map(t => t.path)
    assert.equal(paths.some(p => p.includes("hidden")), false, "nothing is published at a readable path")

    for (const file of ["index.html", "sitemap.xml", "feed.xml", "blog/post.html"]) {
      const html = await readFile(path.join(targetFolder, file), "utf-8")
      assert.equal(html.includes(hashed), false, `${file} leaks the secret URL`)
      assert.equal(html.includes("Secret page"), false, `${file} leaks the page`)
    }
  })
})

test("nothing in the output folder contains a salt - the property the feature exists for", async () => {
  await withSite({
    "settings.md": "---\ndomain: example.com\nname: T\n---\n",
    "home.md": "# Home\n\n/**",
    "blog/hidden##purple-bear/hello.md": "# Secret page\n\nShh.",
    "blog/hidden##purple-bear/sub/deep.md": "# Deeper\n\nStill secret.",
    "notes##red-whale.md": "# Notes\n\nA secret file at the root.",
    "blog/hidden##purple-bear/robots.txt": "User-agent: *"
  }, async ({ sourceFolder, targetFolder }) => {
    const sources = await readdir(sourceFolder, { withFileTypes: true, recursive: true })
    const salts = new Set(sources.flatMap(e => saltsIn(path.relative(sourceFolder, path.join(e.parentPath, e.name)).split(path.sep).join("/"))))
    assert.deepEqual([...salts].sort(), ["purple-bear", "red-whale"], "the fixture has the salts it thinks it has")

    const files = await outputFiles(targetFolder)
    assert.ok(files.length > 0)
    for (const [file, text] of files) {
      for (const salt of salts) {
        assert.equal(text.includes(salt), false, `${file} contains the salt "${salt}"`)
        assert.equal(file.includes(salt), false, `the output path ${file} contains the salt "${salt}"`)
      }
      assert.equal(file.includes("##"), false, `the output path ${file} contains the marker`)
      assert.equal(text.includes("##"), false, `${file} contains the marker`)
    }
  })
})

test("the de-salted name is what renders: title, and the breadcrumb of a secret folder", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "blog/hidden##purple-bear/notes##red-whale.md": "Untitled body, so the title is inferred from the filename."
  }, async ({ targetFolder }) => {
    const folder = hashSegmentInput("blog/hidden##purple-bear")
    const file = hashSegmentInput("blog/hidden##purple-bear/notes##red-whale.md")
    const html = await readFile(path.join(targetFolder, "blog", folder, `${file}.html`), "utf-8")

    assert.match(html, /<h1>Notes<\/h1>/, "the title is the de-salted filename")
    const crumbs = html.match(/<nav aria-label=Breadcrumbs>(.*?)<\/nav>/)?.[1] ?? ""
    assert.match(crumbs, />Hidden</, "the folder crumb is the de-salted folder name, not the hash")
    // The page's own crumb links to its own (hashed) URL, which is fine -
    // the reader is already there. No crumb *text* may be the hash.
    const labels = [...crumbs.matchAll(/>([^<]+)</g)].map(m => m[1])
    assert.equal(labels.some(label => label.includes(folder) || label.includes(file)), false, `a crumb label is a hash: ${labels}`)
  })
})

test("an asset in a secret folder is hashed too - the rule is above the processors", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "drafts##blue-parrot/notes.md": "# Draft\n\nWIP.",
    "drafts##blue-parrot/robots.txt": "User-agent: *"
  }, async ({ site }) => {
    const hashed = hashSegmentInput("drafts##blue-parrot")
    const paths = site.database.target.getAll().map(t => t.path)
    assert.ok(paths.includes(`${hashed}/robots.txt`), "a .txt is routed by a different processor and must still be hashed")
    assert.equal(paths.some(p => p.includes("drafts")), false)
  })
})

test("changing the salt rotates the URL and removes the old output", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "drafts##one/notes.md": "# Draft\n\nWIP."
  }, async ({ sourceFolder, targetFolder, rebuild }) => {
    const before = hashSegmentInput("drafts##one")
    await readFile(path.join(targetFolder, before, "notes.html"), "utf-8")

    await rm(path.join(sourceFolder, "drafts##one"), { recursive: true, force: true })
    await mkdir(path.join(sourceFolder, "drafts##two"), { recursive: true })
    await writeFile(path.join(sourceFolder, "drafts##two", "notes.md"), "# Draft\n\nWIP.")
    await rebuild()

    await assert.rejects(() => readFile(path.join(targetFolder, before, "notes.html"), "utf-8"))
    await readFile(path.join(targetFolder, hashSegmentInput("drafts##two"), "notes.html"), "utf-8")
  })
})

test("secret_key frontmatter is an ordinary property with no effect", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "page.md": "---\nsecret_key: dog\n---\n\n# Ordinary\n\nText."
  }, async ({ site }) => {
    const paths = site.database.target.getAll().map(t => t.path)
    assert.ok(paths.includes("page.html"))
    assert.equal(paths.some(p => /^[0-9a-f]{16}\.html$/.test(p)), false)
  })
})

test("a relative link to a secret page resolves to its hashed url, and a link to nothing does not crash", async () => {
  await withSite({
    "home.md": "# Home\n\n/**",
    "blog/post.md": "# Post\n\nSee my [secret page](./notes##red-whale.md) and a [missing one](./nope.md).",
    "blog/notes##red-whale.md": "# Notes\n\nShh."
  }, async ({ targetFolder }) => {
    const html = await readFile(path.join(targetFolder, "blog", "post.html"), "utf-8")
    const hashed = hashSegmentInput("blog/notes##red-whale.md")
    const hrefs = [...html.matchAll(/href=([^\s>]+)/g)].map(m => m[1])

    assert.ok(hrefs.includes(`/blog/${hashed}`), `the link resolves to the hashed url: ${hrefs}`)
    assert.equal(html.includes("red-whale"), false, "the salt does not reach the page")
    assert.equal(html.includes("##"), false, "nor the marker")
    // The missing link is left as written rather than crashing the build.
    assert.ok(hrefs.some(h => h.includes("nope.md")), `a link to nothing is left alone: ${hrefs}`)
  })
})

test("a listing names a secret folder relatively, by source path, and renders the hashed urls; an absolute one is dropped, never rendered", async () => {
  await withSite({
    "settings.md": "---\nname: T\n---\n",
    "home.md": "# Home\n\nPublic.",
    "studio/members##autumn-glaze/one.md": "# One\n\nFirst.",
    "studio/members##autumn-glaze/two.md": "# Two\n\nSecond.",
    "studio/members##autumn-glaze/index.md": "# Members\n\n./*",
    "studio/guide.md": "# Guide\n\n./members##autumn-glaze/*\n\n/studio/members##autumn-glaze/*\n\n./members##autumn-glaze/one"
  }, async ({ targetFolder }) => {
    const hashed = hashSegmentInput("studio/members##autumn-glaze")

    // Inside the folder, `./*` lists its siblings at their hashed urls.
    // (index.md is a page called index, at the folder's hashed path.)
    const index = await readFile(path.join(targetFolder, "studio", hashed, "index.html"), "utf-8")
    assert.match(index, new RegExp(`href=/studio/${hashed}/one`))
    assert.match(index, new RegExp(`href=/studio/${hashed}/two`))

    // From a sibling page: the relative listing and reference resolve
    // through the source path; the absolute one leaves no trace.
    const guide = await readFile(path.join(targetFolder, "studio", "guide.html"), "utf-8")
    assert.equal((guide.match(new RegExp(`href=/studio/${hashed}/one`, "g")) ?? []).length, 2, "listing + reference")
    assert.equal(guide.includes("##"), false, "the marker never reaches output")
    assert.equal(guide.includes("autumn-glaze"), false, "nor the salt")
  })
})
