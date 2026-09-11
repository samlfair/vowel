import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { globParams, globDirective } from "../plugins/html/editor/directives.js"

test("?view=table renders a glob as a table with the named columns, and the directive round-trips from its classes", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-table-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-table-sys-"))
  let site
  try {
    await mkdir(path.join(sourceFolder, "ideas"))
    await writeFile(path.join(sourceFolder, "settings.md"), "---\ntitle: T\n---\n")
    await writeFile(path.join(sourceFolder, "ideas", "one.md"), "---\nauthor: Ann\n---\n\n# One\n\nFirst idea.\n")
    await writeFile(path.join(sourceFolder, "ideas", "two.md"), "---\nauthor: Bob\n---\n\n# Two\n\nSecond idea.\n")
    await writeFile(path.join(sourceFolder, "index.md"), "# Home\n\n/ideas/**?view=table&properties=title,description,author\n")

    const targetFolder = path.join(systemFolder, "output")
    site = await votive(createConfig(sourceFolder, {
      targetFolder, databasePath: path.join(systemFolder, ".votive.db"), cacheDirectory: path.join(systemFolder, ".cache"), logging: "silent"
    }))
    await (await site.build()).deferred

    const html = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    const table = html.match(/<table[^>]*>[\s\S]*?<\/table>/)?.[0]
    assert.ok(table, `expected a table:\n${html}`)
    assert.match(table, /<th>title<th>description<th>author/)
    assert.match(table, /<a href=\/ideas\/one>One<\/a>/)
    assert.match(table, /<td>First idea\./)
    assert.match(table, /<td>Ann/)
    assert.match(table, /<td>Bob/)

    const classes = table.match(/class="([^"]*)"/)[1].split(" ")
    assert.equal(globDirective(globParams(classes)), "/ideas/**?view=table&properties=title,description,author")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
