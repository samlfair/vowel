import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { check } from "../plugins/check/index.js"

/**
 * An empty key (`domain:`, YAML's null) is not set, and no error
 * (plugins/markdown/frontmatter.js), but it isn't a missing key either:
 * in a subfolder it hides its parent's value, and an empty `domain:` in
 * the root settings.md is a placeholder that warns.
 */

async function withProject(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-empty-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-empty-sys-"))
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
    await run(config)
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

/** What `vowel check` lists, without its summary line. */
async function problems(config) {
  const printed = []
  await check(undefined, { config, notify: ({ message }) => printed.push(message) }).catch(() => {})
  return printed.filter(line => /^(error|warning) {2}/.test(line))
}

const home = "# Home\n"

test("an empty domain: in the root settings.md warns until it is set or removed", async () => {
  await withProject({ "settings.md": "---\nname: Site\ndomain: # like example.com\nauthor:\n---\n", "home.md": home }, async (config) => {
    assert.deepEqual(await problems(config), [
      "warning  settings.md:3:1: `domain:` is empty, so the site has no feed, sitemap or llms.txt. Set it to the site's domain, like example.com, or remove it if the site has none"
    ], "the empty author: is no problem")
  })
  await withProject({ "settings.md": "---\nname: Site\ndomain: \"\"\n---\n", "home.md": home }, async (config) => {
    assert.equal((await problems(config)).length, 1, "empty text is empty too")
  })
  await withProject({ "settings.md": "---\nname: Site\n---\n", "home.md": home }, async (config) => {
    assert.deepEqual(await problems(config), [], "no domain: at all is a site without one")
  })
  await withProject({ "settings.md": "---\nname: Site\ndomain: false\n---\n", "home.md": home }, async (config) => {
    assert.deepEqual(await problems(config), [], "domain: false says so too")
  })
  await withProject({ "settings.md": "---\nname: Site\ndomain: example.com\n---\n", "home.md": home, "blog/settings.md": "---\ndomain:\n---\n", "blog/post.md": "# Post\n" }, async (config) => {
    assert.deepEqual(await problems(config), [], "a subfolder's empty domain: is deliberate")
  })
})

test("an empty key in a subfolder's settings.md hides its parent's value", async () => {
  await withProject({
    "settings.md": "---\nname: Site\nauthor: Sam\nstyles: [site.css]\n---\n",
    "site.css": "body {}\n",
    "home.md": home,
    "blog/settings.md": "---\nauthor:\nstyles:\n---\n",
    "blog/post.md": "# Post\n"
  }, async (config) => {
    const site = await votive(config)
    try {
      await (await site.build()).deferred
      assert.equal(site.database.setting.getByFolder("").lastNonNull("fm_author"), "Sam")
      assert.equal(site.database.setting.getByFolder("blog").lastNonNull("fm_author"), null)
      assert.equal(site.database.setting.getByFolder("blog/drafts").lastNonNull("fm_author"), null, "and below it")
      const post = site.database.target.get("blog/post.html")
      assert.match(post.data, /site\.css/, "an empty styles: in the list is skipped, not linked")
    } finally {
      await site.close()
    }
  })
})

test("false for a text key is an empty key, and true is an error", async () => {
  await withProject({
    "settings.md": "---\nname: false\ndomain: false\nauthor: false\n---\n",
    "home.md": "---\ntitle: true\n---\n# Home\n"
  }, async (config) => {
    assert.deepEqual(await problems(config), ["error  home.md:2:1: `title:` expected text, got true; ignoring it"])
    const site = await votive(config)
    try {
      await (await site.build()).deferred
      const root = site.database.setting.getByFolder("")
      assert.equal(root.lastNonNull("fm_domain"), null, "not the domain \"false\"")
      assert.equal(root.lastNonNull("fm_name"), null)
      assert.equal(site.database.target.get("feed.xml"), undefined, "no feed without a domain")
      const page = site.database.target.get("index.html")
      assert.equal(page.metadata.title, "Home", "title: true is dropped, and the heading is the title")
      assert.doesNotMatch(page.data, />false</, "false is printed nowhere")
    } finally {
      await site.close()
    }
  })
})
