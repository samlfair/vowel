import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir, access, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * A page's markdown mirror, `/blog/post.md` beside `/blog/post`
 * (plugins/markdown/mirror.js): off by default, switched on by the root
 * settings.md's `markdown_mirror`, overridden by a page's own.
 */

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-mirror-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-mirror-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const write = async (rel, body) => {
    await mkdir(path.dirname(path.join(sourceFolder, rel)), { recursive: true })
    await writeFile(path.join(sourceFolder, rel), body)
  }
  const warnings = []
  let site
  try {
    for (const [rel, body] of Object.entries(files)) await write(rel, body)
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      log: (level, message) => { if (level === "warn") warnings.push(message) }
    }))
    await (await site.build()).deferred
    const page = (file) => readFile(path.join(targetFolder, ...file.split("/")), "utf-8")
    const exists = (file) => access(path.join(targetFolder, ...file.split("/"))).then(() => true, () => false)
    const edit = async (rel, body) => {
      await write(rel, body)
      await (await site.build({ changed: [rel] })).deferred
    }
    const list = (dir) => readdir(path.join(targetFolder, ...dir.split("/")))
    await run({ page, exists, edit, list, warnings })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

const post = "---\ndate: 2026-10-14\n---\n# Kerning is a feeling\n\nWe talk about [optical spacing](/about).\n"

test("mirrors are off by default", async () => {
  await withSite({ "home.md": "# Home\n", "blog/kerning.md": post }, async ({ page, exists }) => {
    assert.equal(await exists("blog/kerning.md"), false)
    assert.equal(await exists("index.md"), false)
    assert.doesNotMatch(await page("blog/kerning.html"), /text\/markdown/, "and no page links one")
  })
})

test("the root settings.md mirrors every page, generated ones too", async () => {
  const files = {
    "settings.md": "---\ndomain: example.com\nmarkdown_mirror: true\n---\n",
    "home.md": "# Home\n",
    "blog/kerning.md": post
  }
  await withSite(files, async ({ page, exists }) => {
    const mirror = await page("blog/kerning.md")
    assert.equal(mirror, "# Kerning is a feeling\n\n"
      + "October 14, 2026 · https://example.com/blog/kerning\n\n"
      + "We talk about [optical spacing](https://example.com/about).\n")
    assert.match(await page("blog/kerning.html"), /<link rel=alternate type=text\/markdown href=\/blog\/kerning\.md>/)
    assert.ok(await exists("index.md"), "the homepage")
    assert.ok(await exists("blog.md"), "a generated folder index")
    assert.equal(await exists("settings.md"), false, "settings.md is not a page")
  })
})

test("an alert is GFM's", async () => {
  const files = {
    "settings.md": "---\nmarkdown_mirror: true\n---\n",
    "home.md": "# Home\n\n> [!NOTE]\n> A note.\n\n> [!TIP] Read *this*\n> Body.\n"
  }
  await withSite(files, async ({ page }) => {
    const mirror = await page("index.md")
    assert.match(mirror, /\n> \[!NOTE\]\n> A note\.\n/, "the default heading is left off")
    assert.match(mirror, /\n> \[!TIP\] Read \*this\*\n> Body\.\n/, "an author's heading stays on the marker's line")
  })
})

test("a page's own key wins over the root's", async () => {
  const files = {
    "settings.md": "---\nmarkdown_mirror: true\n---\n",
    "home.md": "# Home\n",
    "out.md": "---\nmarkdown_mirror: false\n---\n# Out\n",
    "in.md": "---\nmarkdown_mirror: true\n---\n# In\n"
  }
  await withSite(files, async ({ exists }) => {
    assert.equal(await exists("out.md"), false)
    assert.ok(await exists("in.md"))
  })
  const off = { "home.md": "# Home\n", "in.md": "---\nmarkdown_mirror: true\n---\n# In\n\nOnly me.\n", "other.md": "# Other\n" }
  await withSite(off, async ({ page, exists }) => {
    assert.match(await page("in.md"), /^# In\n\n\/in\n\nOnly me\.\n$/, "without a domain the url is the path")
    assert.equal(await exists("other.md"), false)
  })
})

test("html_file: false with markdown_mirror: true is a page whose only file is its markdown", async () => {
  const files = {
    "settings.md": "---\nmarkdown_mirror: true\n---\n",
    "home.md": "# Home\n",
    "notes/plain.md": "---\nhtml_file: false\nmarkdown_mirror: true\n---\n# Plain\n\nJust text.\n",
    "notes/card.md": "---\nhtml_file: false\n---\n# Card\n\nOnly in listings.\n",
    "notes/gone.md": "---\nstatus: deleted\nmarkdown_mirror: true\n---\n# Gone\n"
  }
  await withSite(files, async ({ page, exists }) => {
    assert.equal(await exists("notes/plain.html"), false)
    assert.match(await page("notes/plain.md"), /^# Plain\n\n\/notes\/plain\.md\n\nJust text\.\n$/, "it names itself")
    assert.equal(await exists("notes/card.md"), false, "the root switch alone doesn't publish a page without a file")
    assert.equal(await exists("notes/gone.md"), false, "a deleted page is never mirrored")
  })
})

test("a mirror follows its page: an edit rewrites it, switching off removes it", async () => {
  const files = { "settings.md": "---\nmarkdown_mirror: true\n---\n", "home.md": "# Home\n", "blog/kerning.md": post }
  await withSite(files, async ({ page, exists, edit }) => {
    await edit("blog/kerning.md", post.replace("We talk", "We still talk"))
    assert.match(await page("blog/kerning.md"), /We still talk/)

    await edit("blog/kerning.md", post.replace("---\n#", "markdown_mirror: false\n---\n#"))
    assert.equal(await exists("blog/kerning.md"), false)
    assert.doesNotMatch(await page("blog/kerning.html"), /text\/markdown/, "the link goes with it")

    await edit("settings.md", "---\n---\n")
    assert.equal(await exists("index.md"), false, "the root switch off removes every mirror")
  })
})

test("a secret page's mirror sits beside its hashed url", async () => {
  const files = { "settings.md": "---\nmarkdown_mirror: true\n---\n", "home.md": "# Home\n", "notes/diary##purple-moon.md": "# Diary\n\nPrivate.\n" }
  await withSite(files, async ({ list }) => {
    const names = await list("notes")
    const hashed = names.find(name => name.endsWith(".html"))
    assert.ok(hashed, `a hashed page: ${names}`)
    assert.deepEqual(names.filter(name => name.endsWith(".md")), [hashed.replace(/\.html$/, ".md")])
    assert.ok(!names.some(name => name.includes("purple-moon")), "no salt in the output")
  })
})

test("a subfolder's settings.md can't switch mirrors, and says so", async () => {
  const files = { "home.md": "# Home\n", "blog/settings.md": "---\nmarkdown_mirror: true\n---\n", "blog/post.md": "# Post\n" }
  await withSite(files, async ({ exists, warnings }) => {
    assert.equal(await exists("blog/post.md"), false)
    assert.ok(warnings.some(message => message.startsWith("blog/settings.md:2:1: `markdown_mirror:` works only")), warnings.join("\n"))
  })
})

const llmsSite = {
  "settings.md": "---\nname: Sam's site\ndomain: example.com\nmarkdown_mirror: true\n---\n",
  "home.md": "---\nslogan: Notes on type\n---\n# Home\n\nWelcome.\n",
  "about.md": "# About\n\nWho I am.\n",
  "blog/one.md": "---\ndate: 2026-01-02\n---\n# One\n\nFirst post.\n",
  "blog/two.md": "---\ndate: 2026-03-02\n---\n# Two\n\nSecond post. #design\n",
  "blog/2025/old.md": "---\ndate: 2025-03-02\n---\n# Old\n\nOld post.\n",
  "docs/files.md": "# Files\n\nHow files become pages.\n",
  "docs/out.md": "---\nmarkdown_mirror: false\n---\n# Out\n",
  "docs/quiet.md": "---\nstatus: hidden\n---\n# Quiet\n",
  "docs/secret##salt.md": "# Secret\n"
}

test("llms.txt lists every mirror: the root's pages, then a section per top-level folder", async () => {
  await withSite(llmsSite, async ({ page }) => {
    assert.equal(await page("llms.txt"), [
      "# Sam's site",
      "> Notes on type",
      "## Pages\n\n- [Home](https://example.com/index.md): Notes on type\n- [About](https://example.com/about.md): Who I am.",
      "## Blog\n\n- [Two](https://example.com/blog/two.md): Second post. #design\n- [One](https://example.com/blog/one.md): First post.\n- [Old](https://example.com/blog/2025/old.md): Old post.",
      "## Docs\n\n- [Files](https://example.com/docs/files.md): How files become pages."
    ].join("\n\n") + "\n", "no tag pages, folder indexes, opted-out, hidden or secret pages")
  })
})

test("llms.txt needs the root's markdown_mirror and a domain; your own replaces it", async () => {
  const noDomain = { ...llmsSite, "settings.md": "---\nmarkdown_mirror: true\n---\n" }
  await withSite(noDomain, async ({ exists }) => assert.equal(await exists("llms.txt"), false))
  const noMirrors = { ...llmsSite, "settings.md": "---\ndomain: example.com\n---\n" }
  await withSite(noMirrors, async ({ exists }) => assert.equal(await exists("llms.txt"), false))
  const own = { ...llmsSite, "llms.txt": "# Mine\n" }
  await withSite(own, async ({ page }) => assert.equal(await page("llms.txt"), "# Mine\n"))
})

test("mirrors let AI agents in through robots.txt, unless robots says otherwise", async () => {
  const agent = (text, name) => text.split("\n\n").find(block => block.startsWith(`User-agent: ${name}\n`))
  await withSite(llmsSite, async ({ page, edit }) => {
    assert.equal(agent(await page("robots.txt"), "GPTBot"), "User-agent: GPTBot\nAllow: /")
    await edit("settings.md", "---\ndomain: example.com\nmarkdown_mirror: true\nrobots:\n  ai: false\n---\n")
    assert.equal(agent(await page("robots.txt"), "GPTBot"), "User-agent: GPTBot\nDisallow: /", "a declared ai: wins")
    await edit("settings.md", "---\ndomain: example.com\n---\n")
    assert.equal(agent(await page("robots.txt"), "GPTBot"), "User-agent: GPTBot\nDisallow: /", "without mirrors, the default")
  })
})
