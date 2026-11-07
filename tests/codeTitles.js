import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { fromHtml } from "hast-util-from-html"
import { createConfig } from "../config.js"
import { parseFence, fenceWithTitle } from "../plugins/markdown/codeFence.js"
import { richTextBody } from "../plugins/atproto/body.js"

/**
 * A code block's title (plugins/markdown/codeFence.js): ```` ```md "Hello World.md" ````
 * or `title="..."`, rendered as the caption of a <figure>, and written
 * back into the fence by the markdown mirror.
 */

test("the title is title=\"...\", else the first bare quoted string", () => {
  assert.deepEqual(parseFence("md", '"Hello World.md"'), { language: "md", meta: '"Hello World.md"', title: "Hello World.md" })
  assert.equal(parseFence("js", 'title="app.js"').title, "app.js")
  assert.equal(parseFence("js", "title='say \"hi\".js'").title, 'say "hi".js')
  assert.equal(parseFence("js", '"first" title="keyed"').title, "keyed", "title= wins")
  assert.equal(parseFence("js", '"first" "second"').title, "first")
  assert.equal(parseFence("js", 'mark="x"').title, undefined, "another key's value is no title")
  assert.equal(parseFence("js", '{1,3}').title, undefined)
  assert.equal(parseFence("js", '""').title, undefined, "an empty one is none")
  assert.equal(parseFence("js", null).title, undefined)
})

test("a quoted first word is a title, not a language", () => {
  // micromark splits the info string at its first space.
  assert.deepEqual(parseFence('"Hello', 'World.md"'), { language: null, meta: '"Hello World.md"', title: "Hello World.md" })
  assert.deepEqual(parseFence('"notes.txt"', null), { language: null, meta: '"notes.txt"', title: "notes.txt" })
})

test("a title written back: title= after a language, bare without one", () => {
  assert.deepEqual(fenceWithTitle("js", "app.js"), { lang: "js", meta: 'title="app.js"' })
  assert.deepEqual(fenceWithTitle("js", 'say "hi"'), { lang: "js", meta: "title='say \"hi\"'" })
  assert.deepEqual(fenceWithTitle(null, "Hello World.md"), { lang: '"Hello', meta: 'World.md"' })
  assert.deepEqual(fenceWithTitle(null, "notes.txt"), { lang: '"notes.txt"', meta: null })
})

const PAGE = [
  "---\ndescription: Code.\n---\n# Code\n",
  '```md "Hello World.md"\nLorem ipsum\n```\n',
  '```js title="app.js"\nconst a = 1\n```\n',
  '```"notes.txt"\nplain\n```\n',
  "```js\nuntitled()\n```\n"
].join("\n")

test("a built page: a titled block is a figure captioned by its title, and the mirror keeps it", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-titles-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-titles-sys-"))
  try {
    await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: Site\ndomain: example.com\nmarkdown_mirror: true\n---\n")
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    await writeFile(path.join(sourceFolder, "code.md"), PAGE)
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await site.close()

    const html = await readFile(path.join(targetFolder, "code.html"), "utf-8")
    assert.match(html, /<figure><figcaption>Hello World\.md<\/figcaption><pre class=language-md><code class=language-md>/)
    assert.match(html, /<figure><figcaption>app\.js<\/figcaption><pre class=language-js><code class=language-js><span class="token keyword">const/)
    assert.match(html, /<figure><figcaption>notes\.txt<\/figcaption><pre><code>plain/, "no language, and no language-\"notes.txt\"")
    assert.match(html, /<\/figure>\s*<pre class=language-js><code class=language-js><span class="token function">untitled/, "an untitled block is a bare <pre>")

    const mirror = await readFile(path.join(targetFolder, "code.md"), "utf-8")
    assert.ok(mirror.includes('```md title="Hello World.md"\nLorem ipsum\n```'), mirror)
    assert.ok(mirror.includes('```js title="app.js"\nconst a = 1\n```'), mirror)
    assert.ok(mirror.includes('```"notes.txt"\nplain\n```'), mirror)
    assert.ok(mirror.includes("```js\nuntitled()\n```"), mirror)

    const section = fromHtml(html).children.flatMap(function find(node) {
      if (node.properties?.id === "content") return [node]
      return (node.children ?? []).flatMap(find)
    })[0]
    const { text } = richTextBody(section, "https://example.com/code", {})
    assert.ok(text.includes("Hello World.md\n\nLorem ipsum"), "rich text: the title, then the code")
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
