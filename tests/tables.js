import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * A table comes in a <figure>: the figure scrolls when the table is too
 * wide, so the table can be a real table at full width.
 */

test("a markdown table and a table listing are each a table in a figure", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-tables-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-tables-sys-"))
  let site
  try {
    await mkdir(path.join(sourceFolder, "work"))
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n/work/*?view=table\n")
    await writeFile(path.join(sourceFolder, "work", "one.md"), "# One\n")
    site = await votive(createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    const html = await readFile(path.join(systemFolder, "output", "index.html"), "utf-8")
    const content = html.match(/<section id=content>[\s\S]*?<\/section>/)[0]
    const figures = content.match(/<figure>\s*<table[\s\S]*?<\/table>\s*<\/figure>/g) ?? []
    assert.equal(figures.length, 2, content)
    assert.match(figures[0], /<th>a/, "the markdown table")
    assert.match(figures[1], /<table class="_ _work view-table">/, "the listing, its directive's classes on the table")
    assert.doesNotMatch(content.replace(/<figure>\s*<table[\s\S]*?<\/table>\s*<\/figure>/g, ""), /<table/, "no table outside a figure")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
