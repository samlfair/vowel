import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * Editing one page must not change the settings rows, nor the <head> of
 * a page that doesn't depend on it. The dev server's live-reload client
 * compares the served <head> against the pushed one and reloads the
 * whole page when they differ, so a head that changes between builds
 * of unrelated edits means every edit reloads instead of patching.
 *
 * This went wrong once through a readFolder guard that read back a
 * setting it had itself written the pass before: present, so it
 * declined to write it; absent from its return, so the pruning step
 * removed it; absent, so the next pass wrote it again. The root `title`
 * and `theme` rows flipped on every build, in antiphase, and og:title
 * flipped with them - restaling every page each time. Only visible on
 * a project with no settings.md (nothing else contributes those
 * labels), which is why style-builder never showed it.
 *
 * readFolders only runs when a pass has at least one stale source
 * (bundle.js), so each build here is preceded by a real edit; a no-op
 * rebuild never re-enters the hook and would pass by never asking.
 */
function settingsSnapshot(site) {
  return site.database.setting.getAll()
    .map(row => `${row.target}\t${row.label}\t${row.value}`)
    .sort()
    .join("\n")
}

async function headOf(targetFolder, name) {
  const html = await readFile(path.join(targetFolder, name), "utf-8")
  return html.slice(0, html.indexOf("<body"))
}

test("editing one page changes no settings row and no other page's head", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-idempotence-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-idempotence-sys-"))
  let site

  try {
    // Deliberately no settings.md: the site title and theme then come
    // only from what the folder pass infers, which is the case that
    // oscillated.
    await mkdir(path.join(sourceFolder, "blog"))
    await writeFile(path.join(sourceFolder, "about.md"), "# About\n\nSome prose.\n")
    const post = path.join(sourceFolder, "blog", "post.md")
    await writeFile(post, "# Post\n\nA post.\n")

    const targetFolder = path.join(systemFolder, "output")
    const config = createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    })

    site = await votive(config)
    await site.build()

    const settings = settingsSnapshot(site)
    const head = await headOf(targetFolder, "about.html")

    // Four edits, because the failure was a two-cycle: one rebuild can
    // agree with the first by coincidence of phase.
    for (const n of [1, 2, 3, 4]) {
      await writeFile(post, `# Post\n\nA post, edited ${n} times.\n`)
      await site.build({ changed: ["blog/post.md"], deleted: [], defer: false })

      assert.equal(settingsSnapshot(site), settings, `settings rows changed after edit ${n}`)
      assert.equal(await headOf(targetFolder, "about.html"), head, `about.html's <head> changed after edit ${n}`)
    }
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
