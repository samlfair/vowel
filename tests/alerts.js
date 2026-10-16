import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * `> [!TYPE]` makes an alert: GitHub's two-line form and the marker
 * on its own line both work, any word is a type, and the rest of the
 * marker's line is the heading (Obsidian's callout title). Without one,
 * the heading is the type in sentence case.
 */

async function render(markdown) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-alerts-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-alerts-sys-"))
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    await writeFile(path.join(sourceFolder, "about.md"), "# About\n")
    await writeFile(path.join(sourceFolder, "page.md"), `# Page\n\nIntro.\n\n${markdown}\n`)
    site = await votive(createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    const html = await readFile(path.join(systemFolder, "output", "page.html"), "utf-8")
    return html.match(/<section id=content>[\s\S]*?<\/section>/)[0].replace(/\s+/g, " ")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("GitHub's two-line form makes an alert", async () => {
  assert.match(await render("> [!NOTE]\n> Careful."), /<aside class="alert note"><h2>Note<\/h2><p>Careful\. ?<\/aside>/)
})

test("the marker on its own line, then a blank > line, still does", async () => {
  assert.match(await render("> [!NOTE]\n>\n> Careful."), /<aside class="alert note"><h2>Note<\/h2> ?<p>Careful\. ?<\/aside>/)
})

test("the rest of the marker's line is the title, inline markdown and all", async () => {
  assert.match(await render("> [!NOTE] How to render\n> Lorem ipsum."), /<aside class="alert note"><h2>How to render<\/h2><p>Lorem ipsum\. ?<\/aside>/)
  assert.match(await render("> [!TIP] A **bold** [link](/about)\n> Body."), /<h2>A <strong>bold<\/strong> <a href=\/about>link<\/a><\/h2><p>Body\./)
})

test("any word is a type, its heading the word in sentence case", async () => {
  assert.match(await render("> [!CARD]\n> Lorem ipsum."), /<aside class="alert card"><h2>Card<\/h2>/)
  assert.match(await render("> [!my-card]\n> x"), /<aside class="alert my-card"><h2>My card<\/h2>/)
})

test("the paragraph after the marker line keeps its lines, and later blocks stay", async () => {
  const html = await render("> [!CAUTION] Mind\n> First line\n> second line.\n>\n> - a list")
  assert.match(html, /<aside class="alert caution"><h2>Mind<\/h2><p>First line second line\. ?<ul> <li>a list ?<\/ul> ?<\/aside>/)
})

test("an alert with nothing but its marker is a heading alone", async () => {
  assert.match(await render("> [!WARNING]"), /<aside class="alert warning"><h2>Warning<\/h2> ?<\/aside>/)
})

test("a marker that isn't at the start of the quote is just text", async () => {
  assert.match(await render("> just a quote\n> [!NOTE] not a marker"), /<blockquote> ?<p>just a quote \[!NOTE\] not a marker ?<\/blockquote>/)
})
