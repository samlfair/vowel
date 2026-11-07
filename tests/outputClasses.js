import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, copyFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { isExternalURL, externalProperties } from "../plugins/html/externalLinks.js"

/**
 * Classes that say what an element holds, where the element alone
 * doesn't (per Sam, Nov 7): `figure.table`, `figure.code`,
 * `figure.image` and a reference card's `article.reference`. And a link
 * to another site opens in a new tab, with `rel=external`.
 */

async function build(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-classes-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-classes-sys-"))
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
      await writeFile(path.join(sourceFolder, rel), body)
    }
    await copyFile(path.join(import.meta.dirname, "..", "plugins", "images", "favicon.png"), path.join(sourceFolder, "pic.png"))
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await site.close()
    await run((file) => readFile(path.join(targetFolder, file), "utf-8"))
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const settings = "---\nname: Site\ndomain: example.com\nsocial_links:\n  - url: https://bsky.app/profile/example.com\n    label: Bluesky\n---\n"

test("a figure says what it holds: a table, a titled code block, a captioned image", async () => {
  await build({
    "settings.md": settings,
    "home.md": "# Home\n\n/blog/*?view=table\n",
    "blog/post.md": [
      "# Post\n",
      "| a | b |\n|-|-|\n| 1 | 2 |\n",
      '```js "app.js"\nconst a = 1\n```\n',
      "![A picture](/pic.png)\nIts caption.\n"
    ].join("\n")
  }, async (page) => {
    const post = await page("blog/post.html")
    assert.match(post, /<figure class=table><table>/)
    assert.match(post, /<figure class=code><figcaption>app\.js/)
    assert.match(post, /<figure class=image><picture/)
    assert.match(await page("index.html"), /<figure class=table><table class="_ _blog view-table">/, "a listing's table too")
  })
})

test("a reference card's article is marked reference; a listing's cards aren't", async () => {
  await build({
    "settings.md": settings,
    "home.md": "# Home\n\n/blog/post\n\n/blog/*\n",
    "blog/post.md": "# Post\n"
  }, async (page) => {
    const home = await page("index.html")
    assert.match(home, /<section id=content><a href=\/blog\/post><article class="folder_blog page_blog_post reference"/)
    assert.match(home, /<li><a href=\/blog\/post><article class="folder_blog page_blog_post"itemscope>/, "the listing's card has no reference class")
  })
})

test("a link to another site opens in a new tab; this site's own, a path, mailto: and an anchor don't", async () => {
  await build({
    "settings.md": settings,
    "home.md": "# Home\n\nSee [Vowel](https://vowel.cc/docs), [protocol-relative](//other.org/x), [ours](https://example.com/about), [www ours](https://www.example.com/), [a path](/about), [mail](mailto:hi@example.com) and [here](#home).\n",
    "about.md": "# About\n"
  }, async (page) => {
    const home = await page("index.html")
    assert.match(home, /<a href=https:\/\/vowel\.cc\/docs target=_blank rel="external noopener noreferrer">Vowel<\/a>/)
    assert.match(home, /<a href=\/\/other\.org\/x target=_blank rel="external noopener noreferrer">/)
    assert.match(home, /<a href=https:\/\/example\.com\/about>ours<\/a>/)
    assert.match(home, /<a href=https:\/\/www\.example\.com\/>www ours<\/a>/)
    assert.match(home, /<a href=\/about>a path<\/a>/)
    assert.match(home, /<a href=mailto:hi@example\.com>mail<\/a>/)
    assert.match(home, /<a href=#heading_home>here<\/a>/, "an anchor is a heading's, and stays in this tab")
    assert.match(home, /<a href=https:\/\/bsky\.app\/profile\/example\.com rel="me external noopener noreferrer"\s?target=_blank>Bluesky<\/a>/, "a social link keeps rel=me")
    assert.match(home, /Made with <a href=https:\/\/vowel\.cc target=_blank rel="external noopener noreferrer">Vowel<\/a>/)
  })
})

test("isExternalURL: the site's own domain, with or without www. or a scheme, is not another site", () => {
  assert.equal(isExternalURL("https://vowel.cc", "vowel.cc"), false)
  assert.equal(isExternalURL("https://www.vowel.cc/x", "vowel.cc"), false)
  assert.equal(isExternalURL("https://VOWEL.cc/x", "https://www.vowel.cc"), false)
  assert.equal(isExternalURL("https://docs.vowel.cc", "vowel.cc"), true, "a subdomain is another site")
  assert.equal(isExternalURL("https://vowel.cc", undefined), true, "with no domain, every absolute url is")
  assert.equal(isExternalURL("/about", "vowel.cc"), false)
  assert.equal(isExternalURL("mailto:hi@vowel.cc", "vowel.cc"), false)
  assert.deepEqual(externalProperties({ href: "x", rel: "me" }).rel, ["me", "external", "noopener", "noreferrer"])
})
