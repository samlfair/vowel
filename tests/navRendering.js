import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * A nav renders only when it has more than one link (per Sam): the
 * header nav, the aside, the breadcrumb trail and the table of contents.
 * One that would have fewer is left out of the page, not hidden with CSS.
 * Social links are exempt.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-navs-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-navs-sys-"))
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
    await run((file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8"))
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const header = (html) => html.match(/<header>[\s\S]*?<\/header>/)[0]

test("the breadcrumb trail renders from two crumbs: not on the homepage, which has only its own", async () => {
  await withSite({ "home.md": "# Home\n", "about.md": "# About\n" }, async (page) => {
    assert.doesNotMatch(await page("index.html"), /aria-label=Breadcrumbs/)
    assert.match(await page("about.html"), /<nav aria-label=Breadcrumbs><a href=\/>Home<\/a><a href=\/about aria-current=page>About<\/a><\/nav>/)
  })
})

test("the table of contents renders from two entries, at any depth", async () => {
  await withSite({
    "home.md": "# Home\n",
    "none.md": "# None\n\nJust text.\n",
    "one.md": "# One\n\n## Only\n\nText.\n",
    "two.md": "# Two\n\n## First\n\n## Second\n",
    "nested.md": "# Nested\n\n## Parent\n\n### Child\n"
  }, async (page) => {
    assert.doesNotMatch(await page("none.html"), /aria-label=Contents/)
    assert.doesNotMatch(await page("one.html"), /aria-label=Contents/)
    assert.match(await page("two.html"), /<nav aria-label=Contents>/)
    assert.match(await page("nested.html"), /<nav aria-label=Contents>/, "one heading with a subheading is two entries")
  })
})

test("the header nav and the aside render from two entries", async () => {
  await withSite({ "home.md": "# Home\n", "about.md": "# About\n" }, async (page) => {
    const home = await page("index.html")
    assert.doesNotMatch(header(home), /<nav aria-label=Local>/, "the header nav would list About alone")
    assert.match(home, /<aside><nav aria-label=Global>/, "the aside lists Home and About")
  })
  await withSite({ "home.md": "# Home\n" }, async (page) => {
    assert.doesNotMatch(await page("index.html"), /<aside>/, "an aside of the homepage alone is no aside")
  })
  await withSite({ "home.md": "# Home\n", "about.md": "# About\n", "contact.md": "# Contact\n" }, async (page) => {
    assert.match(header(await page("index.html")), /<nav aria-label=Local><ul><li><a href=\/about>About<\/a><li><a href=\/contact>Contact<\/a><\/ul><\/nav>/)
  })
})

test("social links render with a single link: one is still a rel=me verification", async () => {
  await withSite({
    "settings.md": "---\nsocial_links:\n  - label: Mastodon\n    url: https://example.social/@me\n---\n",
    "home.md": "# Home\n"
  }, async (page) => {
    assert.match(header(await page("index.html")), /<nav class=social-links aria-label="Social links">/)
  })
})

test("local_nav_item: false leaves a page out of the header nav; global_nav_item: false out of the aside", async () => {
  await withSite({
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "contact.md": "# Contact\n",
    "colophon.md": "---\nlocal_nav_item: false\n---\n# Colophon\n",
    "legal.md": "---\nglobal_nav_item: false\n---\n# Legal\n"
  }, async (page) => {
    const home = await page("index.html")
    assert.doesNotMatch(header(home), /Colophon/, "local_nav_item: false")
    assert.match(header(home), /href=\/legal>Legal/, "only the aside drops legal")
    const aside = home.match(/<aside>[\s\S]*?<\/aside>/)[0]
    assert.doesNotMatch(aside, /Legal/, "global_nav_item: false")
    assert.match(aside, /Colophon/, "only the header nav drops colophon")
  })
})
