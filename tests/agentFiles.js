import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { writeAgentFiles } from "../cli.js"

/**
 * What a site gives AI agents: an `AGENTS.md` and the Vowel skill,
 * offered by the wizard (cli.js), and an `AGENTS.md` that is never a page.
 */

const exists = (file) => access(file).then(() => true, () => false)

async function withFolder(run) {
  const folder = await mkdtemp(path.join(tmpdir(), "vowel-agents-"))
  try {
    await run(folder)
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}

test("the wizard writes what was asked for, from vowel's own copies", async () => {
  await withFolder(async (folder) => {
    const written = await writeAgentFiles(folder, { agents: true, skill: true })
    assert.deepEqual(written.sort(), ["AGENTS.md", path.join(".claude", "skills", "vowel", "SKILL.md")].sort())
    const template = await readFile(new URL("../templates/AGENTS.md", import.meta.url), "utf-8")
    const skill = await readFile(new URL("../skills/vowel/SKILL.md", import.meta.url), "utf-8")
    assert.equal(await readFile(path.join(folder, "AGENTS.md"), "utf-8"), template)
    assert.equal(await readFile(path.join(folder, ".claude", "skills", "vowel", "SKILL.md"), "utf-8"), skill)
  })
  await withFolder(async (folder) => {
    assert.deepEqual(await writeAgentFiles(folder, { agents: false, skill: false }), [])
    assert.equal(await exists(path.join(folder, "AGENTS.md")), false)
    assert.equal(await exists(path.join(folder, ".claude")), false)
  })
})

test("it never replaces a file the author already has", async () => {
  await withFolder(async (folder) => {
    await writeFile(path.join(folder, "AGENTS.md"), "# Mine\n")
    assert.deepEqual(await writeAgentFiles(folder, { agents: true }), [])
    assert.equal(await readFile(path.join(folder, "AGENTS.md"), "utf-8"), "# Mine\n")
  })
})

test("the skill's frontmatter names it and says when to use it", async () => {
  const skill = await readFile(new URL("../skills/vowel/SKILL.md", import.meta.url), "utf-8")
  const [, frontmatter] = skill.match(/^---\n([\s\S]*?)\n---\n/) ?? []
  assert.match(frontmatter, /^name: vowel$/m)
  const description = frontmatter.match(/^description: (.+)$/m)?.[1] ?? ""
  assert.ok(description.length > 0 && description.length <= 1024, `${description.length} characters`)
})

/** The target paths of a site made from `files`, and its homepage. */
async function build(files, extra = async () => {}) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-agents-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-agents-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  try {
    for (const [name, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, name), body)
    await extra(sourceFolder)
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    const paths = site.database.target.getAll().map(target => target.path)
    await site.close()
    return { paths, home: await readFile(path.join(targetFolder, "index.html"), "utf-8") }
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

// Two sites, not one: on a case-insensitive disk (a Mac's) AGENTS.md
// and agents.md are the same file.
test("AGENTS.md is not a page, and the skill in .claude/ is not read; agents.md is a page", async () => {
  const notes = await build({ "home.md": "# Home\n\n/*\n" }, folder => writeAgentFiles(folder, { agents: true, skill: true }))
  assert.ok(!notes.paths.some(file => /agents|skill/i.test(file)), notes.paths.join("\n"))
  assert.doesNotMatch(notes.home, /Notes for AI agents/, "in no listing")

  const page = await build({ "home.md": "# Home\n", "agents.md": "# Agents\n\nA page about agents.\n" })
  assert.ok(page.paths.includes("agents.html"), "agents.md is an ordinary page")
})
