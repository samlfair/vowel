import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { parse } from "@bomb.sh/args"
import { shouldClear } from "../cli.js"
import { createConfig } from "../config.js"

test("shouldClear: only --clear or --reset starts cold", () => {
  assert.equal(shouldClear(parse([])), false)
  assert.equal(shouldClear(parse(["--logging", "verbose"])), false)
  assert.equal(shouldClear(parse(["--clear"])), true)
  assert.equal(shouldClear(parse(["--reset"])), true)
  assert.equal(shouldClear(undefined), false)
})

test("a warm start reuses the database: a second launch on an unchanged site reads nothing", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-warm-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-warm-sys-"))
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\nHello.")
    await writeFile(path.join(sourceFolder, "about.md"), "# About\n\nText.")
    const messages = []
    const config = () => createConfig(sourceFolder, {
      targetFolder: path.join(systemFolder, "output"),
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      log: (level, message) => messages.push(message)
    })

    const first = await votive(config())
    await (await first.build()).deferred
    await first.close()
    const coldReads = messages.find(m => m.startsWith("wrote "))
    messages.length = 0

    // Same database, same output: what the CLI now does by default.
    const second = await votive(config())
    await (await second.build()).deferred
    await second.close()

    assert.ok(coldReads, "the first launch wrote something")
    assert.ok(messages.some(m => m === "wrote 0 stale targets"), `the second launch wrote nothing: ${messages}`)
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
