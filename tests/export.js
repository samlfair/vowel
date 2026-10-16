import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createConfig } from "../config.js"
import { checkDestination, exportSite } from "../plugins/export/index.js"
import { normalizeDomain, wrongFolderWarning } from "../cli.js"

/** A small project, its build kept in a system folder of its own. */
async function withProject(run) {
  const root = await mkdtemp(path.join(tmpdir(), "vowel-export-"))
  const sourceFolder = path.join(root, "site")
  const systemFolder = path.join(root, "system")
  await mkdir(sourceFolder)
  await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: T\n---\n")
  await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\nHello.\n")
  await writeFile(path.join(sourceFolder, "about.md"), "# About\n")
  const config = createConfig(sourceFolder, {
    targetFolder: path.join(systemFolder, "output"),
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent"
  })
  try {
    await run({ root, config })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const notify = () => {}

test("export refuses the project itself, a folder inside it, a folder containing it, and vowel's own build", async () => {
  await withProject(async ({ root, config }) => {
    const refused = (destination) => {
      const result = checkDestination(destination, config)
      assert.ok("refused" in result, `${destination} should be refused`)
      return result.refused
    }
    assert.match(refused(config.sourceFolder), /inside the project/)
    assert.match(refused(path.join(config.sourceFolder, "dist")), /inside the project/)
    assert.match(refused(path.join(config.sourceFolder, "a", "b")), /inside the project/, "even when the folders don't exist yet")
    assert.match(refused(root), /contains the project/)
    assert.match(refused(config.targetFolder), /vowel keeps its own build/)
    assert.match(refused(path.join(config.targetFolder, "copy")), /vowel keeps its own build/)
    assert.match(refused(""), /say where to export/)
    assert.deepEqual(checkDestination(path.join(root, "export"), config), { path: path.join(root, "export") })

    // A symlink to the project is the project.
    await symlink(config.sourceFolder, path.join(root, "alias"))
    assert.match(refused(path.join(root, "alias", "dist")), /inside the project/)
  })
})

test("export builds the site and copies the output folder to a new or empty folder, and refuses one that isn't empty", async () => {
  await withProject(async ({ root, config }) => {
    const destination = path.join(root, "export", "site")
    const result = await exportSite({ path: destination }, { config, notify })
    assert.equal(result.exported, destination)
    assert.match(await readFile(path.join(destination, "about.html"), "utf-8"), /About/)
    assert.match(await readFile(path.join(destination, "index.html"), "utf-8"), /Hello/)
    assert.deepEqual((await readdir(config.targetFolder, { recursive: true })).sort(), (await readdir(destination, { recursive: true })).sort(), "the whole output folder")

    await assert.rejects(() => exportSite({ path: destination }, { config, notify }), /isn't empty/)
    const empty = path.join(root, "empty")
    await mkdir(empty)
    await exportSite({ path: empty }, { config, notify })
    await writeFile(path.join(root, "file"), "")
    await assert.rejects(() => exportSite({ path: path.join(root, "file") }, { config, notify }), /is a file/)
    await assert.rejects(() => exportSite({ path: path.join(config.sourceFolder, "out") }, { config, notify }), /inside the project/)
  })
})

test("the wizard's domain is what settings.md wants, however it was pasted", () => {
  assert.equal(normalizeDomain(" https://Example.com/ "), "example.com")
  assert.equal(normalizeDomain("example.com"), "example.com")
  assert.equal(normalizeDomain(undefined), "")
})

test("the wrong-folder question: asked in a home folder, or one with things in it and no markdown; not in an empty folder or one with markdown", () => {
  const where = { folder: "/somewhere", home: false }
  assert.match(wrongFolderWarning(["Desktop", "Documents", ".zshrc"], where), /no markdown files, and 2 other things/)
  assert.match(wrongFolderWarning(["photo.jpg"], where), /1 other thing /)
  assert.equal(wrongFolderWarning([], where), undefined)
  assert.equal(wrongFolderWarning([".DS_Store"], where), undefined, "hidden files don't count")
  assert.equal(wrongFolderWarning(["home.md", "photo.jpg"], where), undefined)
  assert.match(wrongFolderWarning(["notes.md"], { folder: "/Users/sam", home: true }), /home folder/)
})
