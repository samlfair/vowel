import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * An image's derivatives (four widths × avif, webp, its own format) are
 * stubs with rows, so a warm start keeps them, a changed image replaces
 * them, and a deleted image removes them. They used to be loose files
 * the startup sweep deleted on the second launch.
 */

async function build(sourceFolder, systemFolder) {
  const site = await votive(createConfig(sourceFolder, {
    targetFolder: path.join(systemFolder, "output"),
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent"
  }))
  await (await site.build()).deferred
  // Derivatives are declared from a read that is deferred, and read
  // deferred themselves: two follow-ups. The dev server gets there on
  // its own; a one-shot build asks for them.
  await (await site.build()).deferred
  await (await site.build()).deferred
  return site
}

const derivatives = async (targetFolder) => (await readdir(targetFolder)).filter(f => /^pic-[0-9a-f]{8}-\d+\.(avif|webp|jpg)$/.test(f)).sort()

test("derivatives survive a warm start, follow the image's content, and go with it", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-derivatives-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-derivatives-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n![a picture](/pic.jpg)\n")
    await sharp({ create: { width: 800, height: 500, channels: 3, background: "#4060a0" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))

    // Cold.
    site = await build(sourceFolder, systemFolder)
    const first = await derivatives(targetFolder)
    assert.equal(first.length, 12, `twelve derivatives: ${first}`)
    const hash = first[0].match(/^pic-([0-9a-f]{8})-/)[1]
    const home = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.ok(home.includes(`/pic-${hash}-414.avif`), "the page's srcset names them")
    assert.ok(home.includes("width=800"), "and carries the measured size")
    const rows = site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE path LIKE 'pic-%'").get().n
    assert.equal(rows, 12, "each derivative is a target")
    await site.close()

    // Warm: a second launch, nothing changed.
    site = await build(sourceFolder, systemFolder)
    assert.deepEqual(await derivatives(targetFolder), first, "the sweep keeps what rows claim")
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE stale = 1").get().n, 0)
    await site.close()

    // The image changes: a new hash, a new set, the old set gone.
    await sharp({ create: { width: 640, height: 400, channels: 3, background: "#a04060" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))
    site = await build(sourceFolder, systemFolder)
    const second = await derivatives(targetFolder)
    assert.equal(second.length, 12)
    assert.ok(!second.some(f => f.includes(hash)), "no derivative of the old bytes remains")
    assert.ok((await readFile(path.join(targetFolder, "index.html"), "utf-8")).includes(second[0].replace(/-\d+\.\w+$/, "")), "the page names the new set")
    const meta = await sharp(path.join(targetFolder, second.find(f => f.endsWith("-414.webp")))).metadata()
    assert.equal(meta.width, 414)
    assert.equal(meta.format, "webp")
    await site.close()

    // The image goes: so do its derivatives.
    await rm(path.join(sourceFolder, "pic.jpg"))
    site = await build(sourceFolder, systemFolder)
    assert.deepEqual(await derivatives(targetFolder), [])
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE path LIKE 'pic-%'").get().n, 0)
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
