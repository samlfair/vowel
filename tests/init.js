import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { siteFiles, writeSite, initProblem, hasInitAnswers, defaultsNotes, nameFromFolder } from "../cli.js"
import { parseFrontmatter, coerce } from "../plugins/markdown/frontmatter.js"

/**
 * `vowel init` (bin.js, cli.js): the wizard's questions as flags, so an
 * agent can set up a site in one command, without a terminal.
 */

const run = promisify(execFile)
const bin = path.join(import.meta.dirname, "..", "bin.js")

async function withFolder(run) {
  const folder = await mkdtemp(path.join(tmpdir(), "vowel-init-"))
  try {
    await run(folder)
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}

/** `vowel init` with these arguments in `folder`: its exit code and output. */
const init = (folder, args) => run(process.execPath, [bin, "init", ...args], { cwd: folder, timeout: 10000 })
  .then(({ stdout, stderr }) => ({ code: 0, stdout, stderr }), error => ({ code: error.code, stdout: error.stdout, stderr: error.stderr }))

test("siteFiles: the answers as settings.md and home.md, quoted where YAML needs it", () => {
  assert.deepEqual(siteFiles({ name: "Sam: notes", theme: "Default", domain: "https://Example.com/", author: "Sam", slogan: "Notes on type" }), [
    { path: "settings.md", text: "---\nname: \"Sam: notes\"\ntheme: default\ndomain: example.com\nauthor: Sam\n---\n" },
    { path: "home.md", text: "---\nslogan: Notes on type\n---\n# Home\n\nWelcome home!\n" }
  ])
  assert.equal(siteFiles({ name: 2024, domain: "x.com", author: "A" })[0].text, "---\nname: \"2024\"\ntheme: default\ndomain: x.com\nauthor: A\n---\n", "a number from the command line stays text")
  assert.equal(siteFiles({ theme: false, domain: "x.com", author: "A" })[0].text, "---\nname: Site Name\ndomain: x.com\nauthor: A\n---\n", "the wizard's None writes no theme")
})

test("siteFiles: what wasn't answered gets a default, and an empty key to fill in", () => {
  const settings = "---\nname: Site Name\ntheme: default\ndomain: # like example.com, for the feed, the sitemap and llms.txt\nauthor: # your name, for the feed\n---\n"
  assert.deepEqual(siteFiles({ home: false }), [{ path: "settings.md", text: settings }])
  assert.equal(siteFiles({ name: "  ", domain: "", author: "" })[0].text, settings, "an empty answer is no answer")

  // The empty keys are YAML's null: read without an error, and kept as null.
  const errors = []
  const tree = { children: [] }
  const node = { type: "yaml", value: settings.split("---\n")[1] }
  const read = parseFrontmatter(tree, node, "settings.md", message => errors.push(message))
  const values = coerce(read.values, "settings.md", "", message => errors.push(message))
  assert.deepEqual(values, { name: "Site Name", theme: "default", domain: null, author: null })
  assert.deepEqual(errors, [])
})

test("defaultsNotes: the placeholder name and the empty domain, once settings.md is written", () => {
  assert.deepEqual(defaultsNotes({}, ["settings.md"]), [
    "Named the site \"Site Name\". Change `name:` in settings.md.",
    "Left `domain:` in settings.md empty. Set it to the site's domain for a feed and a sitemap, or remove it if the site has none."
  ])
  assert.deepEqual(defaultsNotes({ name: "Mine", domain: "https://x.com/" }, ["settings.md"]), [])
  assert.deepEqual(defaultsNotes({}, ["home.md"]), [], "a settings.md that was kept got no defaults")
})

test("nameFromFolder: the wizard's suggestion, unless the folder's name is no site's", () => {
  const home = path.join(path.sep, "home", "sam")
  assert.equal(nameFromFolder(path.join(home, "my-blog"), home), "My Blog")
  assert.equal(nameFromFolder(path.join(home, "type_notes 2026"), home), "Type Notes 2026")
  assert.equal(nameFromFolder(home, home), "Site Name", "a user name is a person's")
  assert.equal(nameFromFolder(path.parse(process.cwd()).root, home), "Site Name", "the root has no name")
})

test("writeSite: writes what's missing, keeps what exists, and says which", async () => {
  await withFolder(async (folder) => {
    await writeFile(path.join(folder, "home.md"), "# Mine\n")
    const result = await writeSite(folder, { name: "Site", agents: true })
    assert.deepEqual(result, { written: ["settings.md", "AGENTS.md"], kept: ["home.md"] })
    assert.equal(await readFile(path.join(folder, "home.md"), "utf-8"), "# Mine\n")
    assert.deepEqual(await writeSite(folder, { agents: true }), { written: [], kept: ["settings.md", "home.md", "AGENTS.md"] })
  })
})

test("initProblem: a misspelled option or an unknown theme is an error", () => {
  assert.match(initProblem({ _: ["init"], titel: "x" }), /unknown option --titel/)
  assert.match(initProblem({ _: ["init"], theme: "fancy" }), /--theme must be default, typography, reset/)
  assert.equal(initProblem({ _: ["init"], name: "X", theme: "Reset", agents: true, logging: "verbose" }), undefined)
  assert.equal(hasInitAnswers({ _: ["init"], force: true }), false, "--force alone answers nothing")
  assert.equal(hasInitAnswers({ _: ["init"], home: false }), true)
})

test("vowel init sets up a site in one command and exits", async () => {
  await withFolder(async (folder) => {
    const result = await init(folder, ["--name", "My Site", "--domain", "example.com", "--agents", "--skill", "--no-home"])
    assert.equal(result.code, 0, result.stderr)
    assert.match(result.stdout, /^Wrote settings\.md, AGENTS\.md, \.claude\/skills\/vowel\/SKILL\.md\./)
    assert.doesNotMatch(result.stdout, /Named the site|domain:/, "nothing was left to a default")
    assert.deepEqual((await readdir(folder)).sort(), [".claude", "AGENTS.md", "settings.md"])
    assert.equal(await readFile(path.join(folder, "settings.md"), "utf-8"), "---\nname: My Site\ntheme: default\ndomain: example.com\nauthor: # your name, for the feed\n---\n")
  })
})

test("vowel init with no options, and no terminal, writes the defaults and says so", async () => {
  await withFolder(async (folder) => {
    const result = await init(folder, [])
    assert.equal(result.code, 0, result.stderr)
    assert.match(result.stdout, /^Wrote settings\.md, home\.md\.\nNamed the site "Site Name"\..*\nLeft `domain:` in settings\.md empty\./)
    assert.match(await readFile(path.join(folder, "settings.md"), "utf-8"), /^---\nname: Site Name\ntheme: default\ndomain: #/)
  })
})

test("without a terminal, vowel init refuses a folder of other things unless --force", async () => {
  await withFolder(async (folder) => {
    await writeFile(path.join(folder, "photo.jpg"), "")
    const refused = await init(folder, ["--name", "X"])
    assert.equal(refused.code, 1)
    assert.match(refused.stderr, /has no markdown files, and 1 other thing in it\. .* Pass --force/)
    assert.deepEqual(await readdir(folder), ["photo.jpg"], "nothing written")

    const forced = await init(folder, ["--name", "X", "--force"])
    assert.equal(forced.code, 0, forced.stderr)
    assert.ok((await readdir(folder)).includes("settings.md"))
  })
})

test("vowel init with a misspelled option exits 1 and writes nothing", async () => {
  await withFolder(async (folder) => {
    const result = await init(folder, ["--titel", "X"])
    assert.equal(result.code, 1)
    assert.match(result.stderr, /unknown option --titel/)
    assert.deepEqual(await readdir(folder), [])
  })
})
