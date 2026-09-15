import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { startServer } from "votive"
import { createConfig } from "../config.js"
import { hashSegmentInput } from "../secretPaths.js"

async function withPreview(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-preview-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-preview-sys-"))
  let server
  try {
    for (const [rel, body] of Object.entries(files)) {
      const full = path.join(sourceFolder, rel)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, body)
    }
    const targetFolder = path.join(systemFolder, "output")
    server = await startServer(createConfig(sourceFolder, {
      targetFolder, databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"), logging: "silent", port: 0
    }))
    const base = `http://127.0.0.1:${server.port}`
    const source = async (page) => {
      const html = await (await fetch(base + page)).text()
      const match = html.match(/<script type="application\/json" id="vowel-source">(.*?)<\/script>/)
      return match ? JSON.parse(match[1]) : null
    }
    await run({ base, source, targetFolder })
  } finally {
    if (server) await server.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("a previewed page carries its own source and the root settings.md, and nothing is served for either", async () => {
  await withPreview({
    "settings.md": "---\ntitle: My Site\n---\n",
    "home.md": "# Home\n\nHello."
  }, async ({ base, source, targetFolder }) => {
    const home = await source("/")
    assert.equal(home.path, "home.md")
    assert.equal(home.markdown, "# Home\n\nHello.")
    assert.equal(home.settings.path, "settings.md")
    assert.equal(home.settings.markdown, "---\ntitle: My Site\n---\n")

    assert.equal((await fetch(base + "/settings.md")).status, 404, "settings.md is no longer a target")
    assert.equal((await fetch(base + "/?source")).headers.get("content-type").startsWith("text/html"), true, "?source is not an endpoint")

    // Only the preview carries it: the written file does not.
    const written = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.equal(written.includes("vowel-source"), false)
  })
})

test("a secret page's source path reaches the preview only, and its frontmatter travels whole", async () => {
  await withPreview({
    "home.md": "# Home\n\n/**",
    "about##salt.md": "---\ndraft: true\n---\n\n# About\n\nShh."
  }, async ({ source, targetFolder }) => {
    const hashed = hashSegmentInput("about##salt.md")
    const page = await source(`/${hashed}`)
    assert.equal(page.path, "about##salt.md", "the author's own browser may know the salt")
    assert.ok(page.markdown.includes("draft: true"), "the frontmatter the editor will keep")

    const written = await readFile(path.join(targetFolder, `${hashed}.html`), "utf-8")
    assert.equal(written.includes("salt"), false)
  })
})

test("a project with no settings.md previews an empty one, so the panel can create it", async () => {
  await withPreview({ "home.md": "# Home" }, async ({ source }) => {
    const home = await source("/")
    assert.deepEqual(home.settings, { path: "settings.md", markdown: null })
  })
})
