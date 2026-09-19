import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { navPartialPath, ASIDE_PARTIAL } from "../plugins/html/partials.js"

/**
 * The header nav and the aside tree are partials: virtual stubs whose
 * params are the data they are made from, rendered once, read once per
 * page. Pinned here: they exist, they are virtual and never listed, the
 * nav a page shows is its folder chain's, and a page appearing in a
 * folder updates every page that shows that folder's nav.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-partials-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-partials-sys-"))
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
    const page = (file) => readFile(path.join(targetFolder, file), "utf-8")
    const header = async (file) => (await page(file)).match(/<header>(.*?)<\/header>/s)[1]
    const aside = async (file) => (await page(file)).match(/<aside>(.*?)<\/aside>/s)[1]
    await run({ site, sourceFolder, targetFolder, page, header, aside, rebuild })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("partials are virtual targets: rows without files, never listed, never in the sitemap", async () => {
  await withSite({
    "settings.md": "---\nname: Site\ndomain: partials.test\n---\n",
    "home.md": "# Home\n\n/**\n",
    "about.md": "# About\n",
    "blog/post.md": "# Post\n"
  }, async ({ site, targetFolder, page }) => {
    for (const rel of [navPartialPath(""), navPartialPath("blog"), ASIDE_PARTIAL]) {
      const target = site.database.target.get(rel)
      assert.ok(target, `${rel} exists`)
      assert.equal(target.write, false)
      assert.ok(target.metadata.hast?.tagName === "nav", `${rel} holds a rendered nav`)
    }
    const files = await readdir(targetFolder, { recursive: true })
    assert.ok(!files.some(f => f.includes("partial")), "no partial file on disk")
    assert.ok(!(await page("index.html")).includes(".partial"), "no partial in a listing")
    assert.ok(!(await page("sitemap.xml")).includes(".partial"))
    assert.ok(!files.includes("partials.html"), "no folder index for the partials folder")
  })
})

test("a page shows its folder chain's nav with itself marked current; a section index shows its own folder's list", async () => {
  await withSite({
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "shop.md": "# Shop\n",
    "shop/hats.md": "# Hats\n",
    "shop/rings.md": "# Rings\n",
    "shop/hats/red.md": "# Red\n"
  }, async ({ header }) => {
    // Root page: the root list, itself current.
    assert.match(await header("about.html"), /<nav><ul><li><a href=\/about aria-current=page>About<\/a><li><a href=\/shop>Shop<\/a><\/ul><\/nav>/)
    // A page in shop/: the root list, then shop's list, itself current.
    assert.match(await header(path.join("shop", "rings.html")), /<ul><li><a href=\/about>About<\/a><li><a href=\/shop>Shop<\/a><\/ul><ul><li><a href=\/shop\/hats>Hats<\/a><li><a href=\/shop\/rings aria-current=page>Rings<\/a><\/ul>/)
    // The section index shop.html (dir "") takes shop/'s chain, ending in its own list.
    assert.match(await header("shop.html"), /<li><a href=\/shop aria-current=page>Shop<\/a><\/ul><ul><li><a href=\/shop\/hats>Hats<\/a>/)
    // Three levels deep: root, shop, shop/hats.
    assert.match(await header(path.join("shop", "hats", "red.html")), /<\/ul><ul><li><a href=\/shop\/hats>Hats<\/a>.*<\/ul><ul><li><a href=\/shop\/hats\/red aria-current=page>Red<\/a><\/ul>/)
  })
})

test("a page appearing updates the nav of every page that shows its folder, and the aside", async () => {
  await withSite({
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "shop/hats.md": "# Hats\n"
  }, async ({ sourceFolder, header, aside, rebuild }) => {
    assert.ok(!(await header(path.join("shop", "hats.html"))).includes("Rings"))
    assert.ok(!(await aside("about.html")).includes("Rings"))

    await writeFile(path.join(sourceFolder, "shop", "rings.md"), "# Rings\n")
    await rebuild({ changed: [path.join("shop", "rings.md")] })

    assert.ok((await header(path.join("shop", "hats.html"))).includes("href=/shop/rings>Rings"), "hats' nav gained rings")
    assert.ok(!(await header("about.html")).includes("Rings"), "the root list is unchanged")
    assert.ok((await aside("about.html")).includes("Rings"), "the aside tree gained rings")

  })
})

test("a second build with nothing changed re-expands no partial and rewrites nothing", async () => {
  await withSite({
    "home.md": "# Home\n",
    "about.md": "# About\n",
    "blog/post.md": "# Post\n\n#tag\n"
  }, async ({ site, rebuild }) => {
    const stubs = () => site.database.raw.prepare("SELECT path, stub FROM sources WHERE path LIKE 'partials%' ORDER BY path").all()
    const before = stubs()
    assert.ok(before.length >= 3)
    await rebuild()
    assert.deepEqual(stubs(), before)
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE stale = 1 AND path NOT LIKE 'feed%'").get().n, 0)
  })
})

test("the aside lists a folder's pages up to 19 of them; a folder with 20 or more shows only its own entry", async () => {
  const files = { "home.md": "# Home\n", "small/settings.md": "", "big/settings.md": "" }
  for (let i = 1; i <= 19; i++) files[`small/page-${String(i).padStart(2, "0")}.md`] = `# Small ${i}\n`
  for (let i = 1; i <= 20; i++) files[`big/page-${String(i).padStart(2, "0")}.md`] = `# Big ${i}\n`
  await withSite(files, async ({ aside }) => {
    const tree = await aside("index.html")
    assert.ok(tree.includes(">Small<") || tree.includes(">Small</a>"), "the small folder is listed")
    assert.equal((tree.match(/href=\/small\/page-/g) ?? []).length, 19, "nineteen pages, eighteen siblings each: all listed")
    assert.ok(tree.includes(">Big<") || tree.includes(">Big</a>"), "the big folder's own entry stays")
    assert.equal((tree.match(/href=\/big\/page-/g) ?? []).length, 0, "twenty siblings are not")
  })
})
