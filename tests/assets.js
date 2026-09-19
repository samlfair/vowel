import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

const exists = (file) => stat(file).then(() => true).catch(() => false)

test("video, data and documents are copied through; a file over the size limit is logged and not published", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-assets-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-assets-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const logged = []
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n[clip](/clip.mp4) [data](/data.csv) [big](/big.mp4)")
    await writeFile(path.join(sourceFolder, "clip.mp4"), Buffer.from("not really video"))
    await writeFile(path.join(sourceFolder, "data.csv"), "a,b\n1,2\n")
    await writeFile(path.join(sourceFolder, "notes.json"), "{\"a\":1}")
    await writeFile(path.join(sourceFolder, "big.mp4"), Buffer.alloc(2048))
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent",
      assetSizeLimit: 1024,
      log: (level, message) => logged.push([level, message])
    }))
    await (await site.build()).deferred

    assert.equal(await readFile(path.join(targetFolder, "clip.mp4"), "utf-8"), "not really video")
    assert.equal(await readFile(path.join(targetFolder, "data.csv"), "utf-8"), "a,b\n1,2\n")
    assert.equal(await readFile(path.join(targetFolder, "notes.json"), "utf-8"), "{\"a\":1}")
    assert.equal(await exists(path.join(targetFolder, "big.mp4")), false)
    assert.equal(site.database.target.get("big.mp4").write, false)
    const errors = logged.filter(([level]) => level === "error").map(([, m]) => m)
    assert.equal(errors.length, 1, errors.join("\n"))
    assert.match(errors[0], /^big\.mp4 is 0\.0 MB; files over 0\.0 MB are not published/)
    assert.equal(site.database.target.getStale().length, 0)
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
