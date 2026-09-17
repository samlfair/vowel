import test from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * The whole link-preview round trip through api.url(): the urls plugin
 * asks for a bare-URL paragraph's URL on the transform side (nothing
 * is fetched yet, the page renders without a card), the deferred pass
 * fetches it and parseLinkPreview stores the result, the page is
 * marked stale because it asked, and the rebuilt page carries the card.
 */
test("a bare URL paragraph becomes a link preview once its fetch has landed", async () => {
  let hits = 0
  const server = http.createServer((req, res) => {
    hits++
    res.writeHead(200, { "content-type": "text/html" })
    res.end(`<html><head><title>Fallback</title><meta property="og:title" content="Fetched Title"><meta property="og:description" content="Fetched description"></head><body></body></html>`)
  })
  await new Promise(resolve => server.listen(0, resolve))
  const url = `http://127.0.0.1:${server.address().port}/article`

  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-preview-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-preview-sys-"))
  let site

  try {
    await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: T\n---\n")
    await writeFile(path.join(sourceFolder, "post.md"), `# Post\n\nSome prose.\n\n${url}\n\nMore prose.\n`)

    const targetFolder = path.join(systemFolder, "output")
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))

    const { deferred } = await site.build()
    const before = await readFile(path.join(targetFolder, "post.html"), "utf-8")
    assert.ok(!before.includes("Fetched Title"), "the foreground pass renders without the preview")

    await deferred
    const after = await readFile(path.join(targetFolder, "post.html"), "utf-8")
    assert.ok(after.includes("Fetched Title"), `the rebuilt page should carry the preview:\n${after.slice(after.indexOf("<main"), after.indexOf("</main>"))}`)
    assert.ok(after.includes("link-preview"), "rendered as a link-preview card")
    assert.equal(hits, 1)

    // A later edit to the page doesn't fetch again: the url is cached.
    await writeFile(path.join(sourceFolder, "post.md"), `# Post\n\nSome prose, edited.\n\n${url}\n`)
    await (await site.build({ changed: ["post.md"], deleted: [] })).deferred
    assert.equal(hits, 1)
    assert.ok((await readFile(path.join(targetFolder, "post.html"), "utf-8")).includes("Fetched Title"))
  } finally {
    if (site) await site.close()
    await new Promise(resolve => server.close(resolve))
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
