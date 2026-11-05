import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm, mkdir, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import votive from "votive"
import { createConfig } from "../config.js"
import { check } from "../plugins/check/index.js"

/**
 * `vowel check` (plugins/check): one fresh build, every warning and
 * error at its place in the source, and a failure when there are any.
 */

async function withProject(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-check-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-check-sys-"))
  try {
    for (const [relative, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, relative)), { recursive: true })
      await writeFile(path.join(sourceFolder, relative), body)
    }
    const config = createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    })
    await run({ config, sourceFolder, systemFolder })
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

/** Runs the check; what it printed, and what it threw. */
async function runCheck(config) {
  const printed = []
  const notify = ({ message }) => printed.push(message)
  const failure = await check(undefined, { config, notify }).then(() => undefined, error => error)
  return { printed, failure }
}

const broken = {
  "settings.md": "---\ntitle: Old spelling\n---\n",
  "home.md": "---\ndate: Thursday\n---\n# Home\n\nA [link](/nowhere) and [[Missing Note]].\n\n![pic](/missing.svg)\n",
  "about.md": "# About\n\n[back](/)\n"
}

test("a clean site passes", async () => {
  await withProject({ "home.md": "# Home\n\n[About](/about)\n", "about.md": "# About\n" }, async ({ config }) => {
    const { printed, failure } = await runCheck(config)
    assert.equal(failure, undefined)
    assert.equal(printed.at(-1), "No problems found.")
  })
})

test("every problem is listed at its line and column, by file then line, and the check fails", async () => {
  await withProject(broken, async ({ config }) => {
    const { printed, failure } = await runCheck(config)
    assert.equal(failure?.message, "1 error and 4 warnings")
    assert.deepEqual(printed.slice(1), [
      "error  home.md:2:1: `date:` expected a date, got \"Thursday\"; ignoring it",
      "warning  home.md:6:3: link to /nowhere matches no page",
      "warning  home.md:6:24: [[Missing Note]] matches no page",
      "warning  home.md:8:1: image /missing.svg matches no file",
      "warning  settings.md:2:1: `title:` in a settings file does nothing - the site's name is `name:`"
    ])
  })
})

test("a warm database doesn't hide anything, and the check leaves the build alone", async () => {
  await withProject(broken, async ({ config, systemFolder }) => {
    const site = await votive({ ...config, log: () => {} })
    await (await site.build()).deferred
    await site.close()
    const before = await readdir(path.join(systemFolder, "output"))

    const { failure } = await runCheck(config)
    assert.equal(failure?.message, "1 error and 4 warnings", "an unchanged file's warnings are still said")
    assert.deepEqual(await readdir(path.join(systemFolder, "output")), before, "the dev server's output is untouched")
  })
})

test("a file too large to publish is reported from a warm buffer cache", async () => {
  await withProject({ "home.md": "# Home\n" }, async ({ config, sourceFolder }) => {
    await writeFile(path.join(sourceFolder, "big.mp4"), Buffer.alloc(2048))
    const small = { ...config, assetSizeLimit: 1024 }
    const first = await runCheck(small)
    const second = await runCheck(small)
    assert.match(first.printed.join("\n"), /error {2}big\.mp4 is 0\.0 MB/)
    assert.match(second.printed.join("\n"), /error {2}big\.mp4 is 0\.0 MB/, "the second check read it from the cache")
  })
})

test("vowel with a word it doesn't know says so and exits 1, rather than starting the preview", async () => {
  const run = promisify(execFile)
  const bin = path.join(import.meta.dirname, "..", "bin.js")
  const result = await run(process.execPath, [bin, "chek"], { timeout: 10000 }).then(() => ({ code: 0, stderr: "" }), error => error)
  assert.equal(result.code, 1)
  assert.match(result.stderr, /unknown command "chek"/)
})

test("frontmatter that doesn't parse is reported at the file's line, where the parser stopped", async () => {
  await withProject({ "home.md": "---\ntitle: Home\ntags: [one\n---\n# Home\n" }, async ({ config }) => {
    const { printed } = await runCheck(config)
    assert.match(printed.join("\n"), /^error {2}home\.md:3:11: frontmatter could not be parsed \(Flow sequence[^)]*\); rendering it as content$/m)
  })
})
