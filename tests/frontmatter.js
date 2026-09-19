import { test } from "node:test"
import assert from "node:assert/strict"
import { fromMarkdown } from "mdast-util-from-markdown"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import getMetadata, { normalizeHeadingLevels } from "../plugins/markdown/metadata.js"
import { resolvePath, EXPECTED } from "../plugins/markdown/frontmatter.js"

/**
 * The markdown plugin's read, with the errors it reported.
 * @param {string} source
 * @param {string} [filePath]
 */
function read(source, filePath = "post.md", targetPath = "post.html") {
  const tree = fromMarkdown(source, { extensions: [frontmatter()], mdastExtensions: [frontmatterFromMarkdown()] })
  normalizeHeadingLevels(tree)
  const errors = []
  const metadata = getMetadata(tree, filePath, targetPath, message => errors.push(message))
  return { metadata, errors, types: tree.children.map(child => child.type) }
}

test("rule 1: YAML that does not parse is rendered as content, with one error naming the file", () => {
  const { metadata, errors, types } = read("---\nmood: [tired, wired\n---\n\n# Title\n\nBody.")
  assert.equal(errors.length, 1)
  assert.match(errors[0], /^post\.md: frontmatter could not be parsed/)
  // No key was inferred from it; the block is whatever markdown it is
  // (here a thematic break, then a setext heading - text underlined by
  // `---`), and the `#` that followed is no longer in first position.
  assert.equal(metadata.fm_mood, undefined)
  assert.equal(metadata.frontmatter_keys, undefined)
  assert.equal(types[0], "thematicBreak")
  assert.equal(types.includes("yaml"), false)
  assert.equal(metadata.title, "Post")
})

test("rule 1: a block that parses to a list or a scalar is not a mapping and is content too", () => {
  const { errors, types } = read("---\n- one\n- two\n---\n\ntext")
  assert.equal(errors.length, 1)
  assert.match(errors[0], /a list, not a mapping/)
  assert.equal(types.includes("yaml"), false)
})

test("rule 2: a wrong value is coerced when it can be, with an error naming the key", () => {
  const { metadata, errors } = read("---\ntitle: [Alpha, Beta]\ntags: solo\nfeed_limit: '7'\npublished: 'no'\nimage: {src: pic.png}\ndate: 03/04/2026\n---\n\ntext")
  assert.equal(metadata.title, "Alpha, Beta")
  assert.deepEqual(metadata.fm_tags, ["solo"])
  assert.equal(metadata.fm_feed_limit, 7)
  assert.equal(metadata.fm_published, false)
  assert.equal(metadata.fm_image, "/pic.png")
  assert.equal(metadata.date, "2026-04-03T00:00:00.000Z")
  assert.equal(errors.length, 5, errors.join("\n"))
  assert.ok(errors.every(error => error.startsWith("post.md: `")), errors.join("\n"))
})

test("rule 2: a value that cannot be coerced is dropped and the key still counts as declared", () => {
  const { metadata, errors } = read("---\ndate: Thursday\ntitle: {a: 1}\nrobots: nope\n---\n\ntext")
  assert.equal(metadata.date, undefined)
  assert.equal(metadata.fm_date, undefined)
  assert.equal(metadata.title, "Post", "the title falls back to the filename")
  assert.equal(metadata.fm_robots, undefined)
  assert.deepEqual(metadata.frontmatter_keys, ["date", "title", "robots"])
  assert.equal(errors.length, 3)
  assert.ok(errors.every(error => error.endsWith("; ignoring it")), errors.join("\n"))
})

test("rule 2: keys vowel does not read are stored as written, whatever their shape", () => {
  const { metadata, errors } = read("---\nrecipe: {prep: 10, cook: [1, 2]}\n---\n\ntext")
  assert.deepEqual(metadata.fm_recipe, { prep: 10, cook: [1, 2] })
  assert.equal(errors.length, 0)
})

test("rule 3: a path is a URL path from the root; ./ is the file's own folder; lowercased", () => {
  assert.equal(resolvePath("x.svg", ""), "/x.svg")
  assert.equal(resolvePath("/x.svg", ""), "/x.svg")
  assert.equal(resolvePath("./Logo.SVG", "blog"), "/blog/logo.svg")
  assert.equal(resolvePath("../up.png", "blog/2026"), "/blog/up.png")
  assert.equal(resolvePath("icons/github.svg", "blog"), "/icons/github.svg")
  assert.equal(resolvePath("https://cdn.example.com/A.png", "blog"), "https://cdn.example.com/A.png")

  const { metadata } = read("---\nlogo: ./logo.svg\nsocial_links:\n  - url: https://a.example\n    icon: ./a.svg\n  - label: no url\n---\n", "blog/settings.md", "blog/settings.md")
  assert.equal(metadata.logo, "/blog/logo.svg")
  assert.deepEqual(metadata.fm_social_links, [{ url: "https://a.example", icon: "/blog/a.svg" }])
})

test("every key in the contract is one vowel reads", () => {
  assert.ok(Object.keys(EXPECTED).length > 15)
  assert.equal(EXPECTED.icon, "path")
})

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-fm-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-fm-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const logged = []
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
      logging: "silent",
      log: (level, message) => logged.push([level, message])
    }))
    await (await site.build()).deferred
    await run({ targetFolder, logged })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("a site with a broken file and bad values builds whole, logs each, and renders paths from the root", async () => {
  await withSite({
    "settings.md": "---\nname: T\nlogo: ./logo.svg\nicon: favicon.svg\n---\n",
    "logo.svg": "<svg/>",
    "favicon.svg": "<svg/>",
    "good.md": "# Good\n\nFine.",
    "broken.md": "---\nmood: [tired, wired\n---\n\n# Broken\n\nStill here.",
    "dated.md": "---\ndate: Thursday\ntitle: [A, B]\n---\n\n# Dated\n\nText."
  }, async ({ targetFolder, logged }) => {
    const good = await readFile(path.join(targetFolder, "good.html"), "utf-8")
    assert.match(good, /src=\/logo\.svg/)
    assert.match(good, /<link href=\/favicon\.svg rel=icon type=image\/svg\+xml>/)
    const broken = await readFile(path.join(targetFolder, "broken.html"), "utf-8")
    assert.match(broken, /Still here\./)
    assert.match(broken, /<hr>/)
    const dated = await readFile(path.join(targetFolder, "dated.html"), "utf-8")
    assert.match(dated, /<h1>A, B<\/h1>/)
    assert.equal(dated.includes("<time"), false)
    const errors = logged.filter(([level]) => level === "error").map(([, m]) => m)
    assert.equal(errors.length, 3, errors.join("\n"))
    assert.ok(errors.some(m => m.startsWith("broken.md: frontmatter could not be parsed")))
    assert.ok(errors.some(m => m.startsWith("dated.md: `date:`")))
    assert.ok(errors.some(m => m.startsWith("dated.md: `title:`")))
  })
})
