import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { socialLinks } from "../plugins/html/socialLinks.js"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-social-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-social-sys-"))
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
    await run({ site, targetFolder })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("socialLinks: the nearest folder's whole list wins; nothing above it contributes", () => {
  const view = (slots) => ({ raw: () => slots })
  const root = [{ label: "GitHub", url: "https://github.com/a" }, { label: "Bluesky", url: "https://bsky.app/a" }]
  const leaf = [{ label: "Shop", url: "https://shop.example" }]

  assert.deepEqual(socialLinks(view([root, null])), root)
  assert.deepEqual(socialLinks(view([root, leaf])), leaf)
  assert.deepEqual(socialLinks(view([null, null])), [])
  assert.deepEqual(socialLinks(view(undefined)), [])
  assert.deepEqual(socialLinks({}), [])
  // An entry with no url is not a link.
  assert.deepEqual(socialLinks(view([[{ label: "nowhere" }, ...leaf]])), leaf)
})

test("social links render in the header and the footer, with the icon's alt text being the label", async () => {
  await withSite({
    "settings.md": [
      "---",
      "social_links:",
      "  - label: GitHub",
      "    url: https://github.com/sam",
      "    icon: icons/GitHub.svg",
      "  - label: Bluesky",
      "    url: https://bsky.app/profile/sam",
      "---",
      ""
    ].join("\n"),
    "icons/GitHub.svg": "<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor'></svg>",
    "home.md": "# Home\n",
    "shop/settings.md": "---\nsocial_links:\n  - label: Etsy\n    url: https://etsy.com/shop/sam\n---\n",
    "shop/hats.md": "# Hats\n"
  }, async ({ targetFolder }) => {
    const home = await readFile(path.join(targetFolder, "index.html"), "utf-8")

    // The output is minified: attributes are unquoted where they can be.
    const navs = home.match(/<nav class=social-links aria-label="Social links">/g) ?? []
    assert.equal(navs.length, 2, "one in the header, one in the footer")
    assert.match(home, /<header>.*<nav class=social-links.*<\/header>/s)
    assert.match(home, /<footer>.*<nav class=social-links.*<\/footer>/s)

    // With an icon: an image whose alt is the label, and the url as --icon-url
    // for a stylesheet mask. Lowercased, like every vowel path.
    assert.match(home, /<a href=https:\/\/github.com\/sam rel=me style='--icon-url: url\(&#34\/icons\/github.svg&#34\)'><img src=\/icons\/github.svg alt=GitHub><\/a>/)
    // Without: the label is the text.
    assert.match(home, /<a href=https:\/\/bsky.app\/profile\/sam rel=me>Bluesky<\/a>/)

    // The shop folder's list replaces the root's.
    const hats = await readFile(path.join(targetFolder, "shop", "hats.html"), "utf-8")
    assert.match(hats, /Etsy/)
    assert.ok(!hats.includes("github.com"), "the root list should not reach the shop")
  })
})
