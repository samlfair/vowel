import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * A link, wikilink or image to this site that would 404 is warned about
 * once per write, naming the page and what it asked for. A link that
 * resolves is rewritten to where the target is served.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-links-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-links-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const warnings = []
  let site
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
      await writeFile(path.join(sourceFolder, rel), body)
    }
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      log: (level, message) => { if (level === "warn") warnings.push(message) }
    }))
    await (await site.build()).deferred
    const page = (file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8")
    await run({ site, sourceFolder, page, warnings })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const content = (html) => html.match(/<section id=content>[\s\S]*?<\/section>/)[0]

test("links that go nowhere are warned about; links that resolve are not", async () => {
  await withSite({
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "pic.svg": "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    "blog/post.md": "# Post\n\n## Section\n",
    "blog/links.md": [
      "# Links",
      "[a](/about) [b](/about/) [c](./post.md) [d](../about.md) [e](post.md) [f](./post.md#section) [g](about) [h](../pic.svg)",
      "[out](https://example.com) [top](#top) [mail](mailto:me@example.com)",
      "[x](/missing) [y](./gone.md) [z](../nope/deeper)",
      "[[About]] [[Nowhere]]",
      "![fine](/pic.svg) ![lost](/lost.svg) ![later](/later.png) [later](./later.pdf)"
    ].join("\n\n") + "\n"
  }, async ({ page, warnings }) => {
    const mine = warnings.filter(message => message.startsWith(path.join("blog", "links.md")))
    assert.deepEqual(mine.sort(), [
      `${path.join("blog", "links.md")}: [[Nowhere]] matches no page`,
      `${path.join("blog", "links.md")}: image /lost.svg matches no file`,
      `${path.join("blog", "links.md")}: link to ../nope/deeper matches no page`,
      `${path.join("blog", "links.md")}: link to ./gone.md matches no page`,
      // From /blog/links a browser asks for /blog/about.
      `${path.join("blog", "links.md")}: link to about matches no page`,
      `${path.join("blog", "links.md")}: link to /missing matches no page`
    ].sort())

    const html = content(await page("blog/links.html"))
    for (const [text, href] of [["a", "/about"], ["b", "/about"], ["c", "/blog/post"], ["d", "/about"], ["e", "/blog/post"], ["f", "/blog/post#section"], ["h", "/pic.svg"]]) {
      assert.match(html, new RegExp(`<a href=${href}>${text}</a>`), `${text} → ${href}`)
    }
    assert.match(html, /<a href=\.\.\/nope\/deeper>z<\/a>/, "a broken link is left as written")
  })
})

test("a file read in the background isn't warned about: on a cold build it has no target until after the first write", async () => {
  await withSite({
    "home.md": "# Home\n\n![shot](./shot.png) [pdf](./report.pdf)\n",
    "report.pdf": "%PDF-1.4\n"
  }, async ({ page, warnings }) => {
    // shot.png is missing and report.pdf is there: vowel can't tell
    // which until the background read, so neither warns.
    assert.deepEqual(warnings.filter(message => message.startsWith("home.md")), [])
    assert.match(await page("index.html"), /<a href=\/report.pdf>pdf<\/a>/, "the link resolves once the file is read")
  })
})

test("a relative url resolves against the page's own url, as a browser would", async () => {
  await withSite({
    "home.md": "# Home\n\n[about](about) [blog post](blog/post)\n",
    "about.md": "# About\n",
    "blog/post.md": "# Post\n"
  }, async ({ page, warnings }) => {
    assert.deepEqual(warnings.filter(message => message.startsWith("home.md")), [])
    const html = content(await page("index.html"))
    assert.match(html, /<a href=\/about>about<\/a>/)
    assert.match(html, /<a href=\/blog\/post>blog post<\/a>/)
  })
})

test("a link into a secret folder keeps its ## and finds the hashed page", async () => {
  await withSite({
    "home.md": "# Home\n\n[members](./club##k9x/welcome.md)\n",
    "club##k9x/welcome.md": "# Welcome\n"
  }, async ({ page, warnings }) => {
    assert.deepEqual(warnings.filter(message => message.startsWith("home.md")), [])
    const html = content(await page("index.html"))
    assert.doesNotMatch(html, /##/, "the salt never reaches the page")
    assert.match(html, /<a href=\/[0-9a-z]+\/[0-9a-z]+>members<\/a>/)
  })
})

test("a page that appears later clears the warning: the link was a tracked miss", async () => {
  await withSite({
    "home.md": "# Home\n\n[soon](/soon) [[Later]]\n"
  }, async ({ site, sourceFolder, page, warnings }) => {
    assert.ok(warnings.some(message => message === "home.md: link to /soon matches no page"))
    assert.ok(warnings.some(message => message === "home.md: [[Later]] matches no page"))

    warnings.length = 0
    await writeFile(path.join(sourceFolder, "soon.md"), "# Soon\n")
    await writeFile(path.join(sourceFolder, "later.md"), "# Later\n")
    await (await site.build({ changed: ["soon.md", "later.md"] })).deferred
    assert.deepEqual(warnings.filter(message => message.startsWith("home.md")), [])
    const html = content(await page("index.html"))
    assert.match(html, /<a href=\/soon>soon<\/a>/)
    assert.match(html, /href=\/later/)
  })
})
