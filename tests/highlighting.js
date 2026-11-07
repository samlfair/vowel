import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { toHtml } from "hast-util-to-html"
import { createConfig } from "../config.js"
import { highlightCode } from "../plugins/html/highlighting.js"

/**
 * Syntax highlighting with Prism (plugins/html/highlighting.js), and
 * Vowel's markdown grammar for it (markdownGrammar.js): GFM, then
 * Vowel's own syntax.
 */

/** The tokens Prism finds in `code`, as `class text` strings, outermost first. */
function tokens(code, language = "markdown") {
  const found = []
  const walk = (node) => {
    if (node.type === "element") found.push(`${node.properties.className.join(" ")}: ${toHtml({ type: "root", children: node.children }).replace(/<[^>]+>/g, "")}`)
    for (const child of node.children ?? []) walk(child)
  }
  walk(highlightCode(code, language))
  return found
}

test("a language Prism knows is highlighted, matched case-insensitively; one it doesn't is not", () => {
  assert.ok(tokens("const a = 1", "js").includes("token keyword: const"))
  assert.ok(tokens("const a = 1", "JS").includes("token keyword: const"))
  assert.equal(highlightCode("plain", "nosuchlang"), undefined)
})

test("every name highlight.js highlighted still highlights", () => {
  const names = ["arduino", "bash", "sh", "zsh", "c", "h", "cpp", "cc", "c++", "hpp", "cxx", "csharp", "cs", "c#",
    "css", "diff", "patch", "go", "golang", "graphql", "gql", "ini", "toml", "java", "javascript", "js", "jsx", "mjs",
    "cjs", "json", "jsonc", "kotlin", "kt", "less", "lua", "makefile", "mk", "markdown", "md", "mkdown", "objectivec",
    "mm", "obj-c", "perl", "pl", "php", "python", "py", "ipython", "r", "ruby", "rb", "gemspec", "irb", "rust", "rs",
    "scss", "shell", "console", "shellsession", "sql", "swift", "typescript", "ts", "tsx", "mts", "vbnet", "vb",
    "wasm", "xml", "html", "xhtml", "svg", "plist", "yaml", "yml"]
  const plain = names.filter(name => highlightCode("x", name) === undefined)
  assert.deepEqual(plain, [])
})

test("markdown: frontmatter is YAML, on the first line only", () => {
  assert.ok(tokens("---\ntitle: Kerning\n---\n# Kerning\n").includes("token key atrule: title"))
  const late = tokens("\n---\ntitle: x\n---\n")
  assert.ok(!late.some(token => token.startsWith("token front-matter")), "after a blank line it is a rule and a heading, as Vowel reads it")
  assert.ok(late.some(token => token.startsWith("token title important")))
})

test("markdown: GFM's fences, tables, task lists, footnotes and autolinks", () => {
  const tilde = tokens("~~~css\nbody { color: red }\n~~~\n")
  assert.ok(tilde.includes("token property: color"), "a ~~~ fence is code, highlighted in its language, not strikethrough")
  assert.ok(!tilde.some(token => token.startsWith("token strike")))

  const nested = tokens("````markdown\n```js\nconst a = 1\n```\n````\n")
  assert.ok(nested.includes("token punctuation: ````"), "the four-backtick fence closes with four")
  assert.ok(nested.includes("token code-language: js"), "and the fence inside it is markdown")

  const titled = tokens('```js "app.js"\nconst a = 1\n```\n')
  assert.ok(titled.includes("token code-language: js"), "the language is the first word, not the title")
  assert.ok(titled.includes("token string: \"app.js\""), "the title is its own token")
  assert.ok(titled.includes("token keyword: const"), "and the block is still highlighted in its language")
  assert.ok(tokens('```js title="app.js"\nconst a = 1\n```\n').includes("token keyword: const"))
  const untitled = tokens('```"Markdown notes"\n# plain\n```\n')
  assert.ok(!untitled.some(token => token.startsWith("token code-language")), "a quoted first word is no language")
  assert.ok(!untitled.some(token => token.startsWith("token title")), "so the block isn't highlighted as Markdown")

  assert.ok(tokens("| a | b |\n|-|:-:|\n| 1 | 2 |\n").some(token => token.startsWith("token table:")), "a delimiter cell of one dash")
  assert.ok(tokens("- [x] done\n1. [ ] todo\n").filter(token => token.startsWith("token checkbox keyword")).length === 2)
  assert.ok(tokens("- [x] done\n").includes("token list punctuation: -"), "the task item's marker is still a list marker")
  assert.ok(tokens("A claim.[^1]\n\n[^1]: The source.\n").includes("token footnote-definition url: [^1]:"))
  assert.ok(tokens("See <https://vowel.cc> and https://vowel.cc/docs.").includes("token autolink url: https://vowel.cc/docs"), "without the full stop")
  assert.ok(tokens("~~struck~~").some(token => token.startsWith("token strike")), "strikethrough still is")
})

test("markdown: Vowel's own syntax, as Vowel reads it", () => {
  const text = tokens("> [!NOTE] Title\n\nSee [[Hello World]] and [[notes/twin|my twin]], #design and #science/physics.\nNot blog/secret##salt, a#b or 10:30. An :apple:, :icons/star: and ==marked== text.\n\n/blog/*\n\nNot /a/path mid-sentence.\n")
  assert.ok(text.includes("token alert important: [!NOTE]"))
  assert.ok(text.includes("token wikilink url: [[Hello World]]"))
  assert.ok(text.includes("token wikilink url: [[notes/twin|my twin]]"))
  assert.ok(text.includes("token hashtag tag: #design"))
  assert.ok(text.includes("token hashtag tag: #science/physics"))
  assert.equal(text.filter(token => token.startsWith("token hashtag")).length, 2, "no salt, a#b or heading")
  assert.ok(text.includes("token shortcode symbol: :apple:"))
  assert.ok(text.includes("token shortcode symbol: :icons/star:"))
  assert.equal(text.filter(token => token.startsWith("token shortcode")).length, 2, "not the time")
  assert.ok(text.includes("token mark important: ==marked=="))
  assert.ok(text.includes("token directive function: /blog/*"))
  assert.equal(text.filter(token => token.startsWith("token directive")).length, 1, "a path in a sentence is prose")
  assert.ok(tokens("# Heading\n").some(token => token.startsWith("token title important")), "a heading is no hashtag")
})

test("a built page: the language on the <pre> and the <code>, and the stylesheet linked", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-highlight-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-highlight-sys-"))
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n```js\nconst a = 1\n```\n\n```nosuchlang\nplain\n```\n")
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await site.close()
    const html = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.match(html, /<pre class=language-js><code class=language-js><span class="token keyword">const<\/span>/)
    assert.match(html, /<pre><code class=language-nosuchlang>plain\n?<\/code><\/pre>/, "an unknown language is left alone")
    assert.match(html, /href=\/syntax-highlighting\.css/)
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
