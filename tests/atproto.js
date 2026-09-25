import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import http from "node:http"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import vowelAtprotoPlugin, { validDID } from "../plugins/atproto/index.js"
import createRkey from "../plugins/atproto/rkey.js"
import { planWrites, planPublication, blobCID, passwordFile } from "../plugins/atproto/publish.js"
import { stat } from "node:fs/promises"
import { publicationURI } from "../plugins/atproto/record.js"
import { coerce } from "../plugins/markdown/frontmatter.js"
import sharp from "sharp"

async function withSite(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    for (const [rel, body] of Object.entries(files)) await writeFile(path.join(sourceFolder, rel), body)
    site = await votive(createConfig(sourceFolder, {
      targetFolder, databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"), logging: "silent", urlHostInterval: 0
    }))
    const rebuild = async () => { await (await site.build()).deferred }
    await rebuild()
    const wellKnown = path.join(targetFolder, ".well-known", "atproto-did")
    const exists = () => access(wellKnown).then(() => true, () => false)
    await run({ sourceFolder, rebuild, wellKnown, exists })
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("validDID accepts did:plc and did:web and nothing that is not a DID", () => {
  assert.equal(validDID("did:plc:ewvi7nxzyoun6zhxrhs64oiz"), true)
  assert.equal(validDID("did:web:littlefair.ca"), true)
  assert.equal(validDID("littlefair.ca"), false)
  assert.equal(validDID("did:plc"), false)
  assert.equal(validDID(42), false)
})

test("atproto_did in settings.md is served at /.well-known/atproto-did, and removing it removes the file", async () => {
  await withSite({
    "settings.md": "---\natproto_did: did:plc:ewvi7nxzyoun6zhxrhs64oiz\n---\n",
    "home.md": "# Home"
  }, async ({ sourceFolder, rebuild, wellKnown, exists }) => {
    assert.equal(await readFile(wellKnown, "utf-8"), "did:plc:ewvi7nxzyoun6zhxrhs64oiz")

    await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: T\n---\n")
    await rebuild()
    assert.equal(await exists(), false, "no did, no file: a stub that stops being declared takes its file with it")
  })
})

test("a site with no atproto block produces no well-known file, and a malformed did fails loudly", async () => {
  await withSite({ "home.md": "# Home" }, async ({ exists }) => {
    assert.equal(await exists(), false)
  })
  await assert.rejects(
    () => withSite({ "settings.md": "---\natproto_did: littlefair.ca\n---\n", "home.md": "# Home" }, async () => {}),
    /atproto_did must look like/
  )
})

const DID = "did:plc:ewvi7nxzyoun6zhxrhs64oiz"
const TID = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/

/** settings.md for a site with an account, a domain and, optionally, a PDS and a lexicon. */
function rootSettings({ pds, lexicon = "site.standard.document" } = {}) {
  const lines = [
    "---",
    "name: T",
    "domain: example.com",
    `atproto_did: ${DID}`,
    ...(pds ? [`atproto_pds: ${pds}`] : []),
    ...(lexicon ? [`atproto_lexicon: ${lexicon}`] : []),
    "---",
    ""
  ]
  return lines.join("\n")
}

/**
 * A project on disk, built once. `records()` maps each source path to
 * the AT-URI and record its page carries; `warnings` collects what the
 * build warned about.
 */
async function withProject(files, run) {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-atproto-sys-"))
  const warnings = []
  const config = createConfig(sourceFolder, {
    targetFolder: path.join(systemFolder, "output"),
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent",
    urlHostInterval: 0,
    log: (level, message) => { if (level === "warn" || level === "info") warnings.push(`${level}: ${message}`) }
  })
  try {
    for (const [relative, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(sourceFolder, relative)), { recursive: true })
      await writeFile(path.join(sourceFolder, relative), body)
    }
    const site = await votive(config)
    try {
      await (await site.build()).deferred
      const records = () => {
        const targets = site.database.target.getAll()
        const pages = targets.filter(target => "atUri" in target.metadata)
        return new Map(pages.map(target => [target.source, { atUri: target.metadata.atUri, record: target.metadata.atprotoRecord, path: target.path }]))
      }
      await run({ sourceFolder, targetFolder: config.targetFolder, config, records, warnings })
    } finally {
      await site.close()
    }
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
}

test("createRkey: a TID-shaped key from the canonical URL; another page or another domain is another key; pinned", () => {
  const key = createRkey("https://example.com/blog/post")
  assert.match(key, TID)
  assert.equal(createRkey("https://example.com/blog/post"), key)
  assert.notEqual(createRkey("https://example.com/blog/other"), key)
  assert.notEqual(createRkey("https://elsewhere.test/blog/post"), key, "two sites on one account never share a key")
  // Frozen: changing the function moves every published record to a new key.
  // The value is checked against an independent FNV-1a implementation.
  assert.equal(key, "bdisnlclezt7b")
})

test("a dated page under a lexicon gets an AT-URI, a site.standard.document record and a link", async () => {
  await withProject({
    "settings.md": rootSettings(),
    "blog/post.md": "---\ndate: 2026-03-04\ndescription: A short post.\n---\n# Post\n\nBody text #design.\n"
  }, async ({ targetFolder, records }) => {
    const page = records().get(path.join("blog", "post.md"))
    assert.ok(page, "the page has a record")
    assert.equal(page.atUri, `at://${DID}/site.standard.document/${createRkey("https://example.com/blog/post")}`)
    assert.deepEqual(
      { ...page.record, textContent: undefined },
      {
        $type: "site.standard.document",
        site: publicationURI(DID, "https://example.com"),
        path: "/blog/post",
        title: "Post",
        publishedAt: "2026-03-04T00:00:00.000Z",
        description: "A short post.",
        tags: ["design"],
        textContent: undefined
      }
    )
    assert.match(page.record.textContent, /Body text/)

    const html = await readFile(path.join(targetFolder, page.path), "utf-8")
    // Minified output drops attribute quotes, so the href is captured, not matched.
    const link = html.match(/<link[^>]*rel="?site\.standard\.document"?[^>]*href="?([^"\s>]+)/)
    assert.equal(link?.[1], page.atUri, "the page links its record")
  })
})

test("no lexicon, no record; an undated page under a lexicon is skipped quietly, an unsupported lexicon warns", async () => {
  await withProject({
    "settings.md": rootSettings({ lexicon: null }),
    "blog/post.md": "---\ndate: 2026-03-04\n---\n# Post\n",
    "journal/settings.md": "---\natproto_lexicon: site.standard.document\n---\n",
    "journal/entry.md": "# Undated\n",
    "notes/settings.md": "---\natproto_lexicon: com.example.note\n---\n",
    "notes/note.md": "---\ndate: 2026-03-04\n---\n# Note\n"
  }, async ({ targetFolder, records, warnings }) => {
    assert.equal(records().size, 0)
    assert.ok(warnings.some(line => line.startsWith("info: journal/entry.html") && line.includes("needs date")), warnings.join("\n"))
    assert.ok(!warnings.some(line => line.startsWith("warn: journal/")), "a page missing a property is not a warning")
    assert.ok(warnings.some(line => line.startsWith("warn: notes/note.html") && line.includes("com.example.note")), warnings.join("\n"))
    const html = await readFile(path.join(targetFolder, "blog", "post.html"), "utf-8")
    assert.ok(!html.includes("site.standard.document"))
  })
})

test("a secret page is published only when its lexicon is set inside its secret scope", async () => {
  const post = "---\ndate: 2026-03-04\n---\n# Post\n"
  await withProject({
    "settings.md": rootSettings(),
    "members##salt/post.md": post,
    "club##salt/settings.md": "---\natproto_lexicon: site.standard.document\n---\n",
    "club##salt/post.md": post,
    "hidden##salt/page.md": "---\ndate: 2026-03-04\natproto_lexicon: site.standard.document\n---\n# Page\n"
  }, async ({ records }) => {
    const published = records()
    assert.ok(!published.has(path.join("members##salt", "post.md")), "a lexicon from above the secret folder does not reach it")
    assert.ok(published.has(path.join("club##salt", "post.md")), "a lexicon in the secret folder's own settings.md does")
    assert.ok(published.has(path.join("hidden##salt", "page.md")), "so does the page's own frontmatter")
    for (const { atUri, record } of published.values()) {
      assert.ok(!atUri.includes("salt") && !JSON.stringify(record).includes("salt"), "no salt reaches a record")
    }
  })
})

test("planWrites: create, update, unchanged, delete this site's orphans, and leave other sites alone", () => {
  const site = "https://example.com"
  const uri = (rkey) => `at://${DID}/site.standard.document/${rkey}`
  const record = (title, other = site) => ({ $type: "site.standard.document", site: other, title })
  const local = [
    { uri: uri("aaaaaaaaaaaaa"), value: record("New") },
    { uri: uri("bbbbbbbbbbbbb"), value: record("Changed") },
    { uri: uri("ccccccccccccc"), value: record("Same") },
    { uri: uri("ddddddddddddd"), value: record("Collides") }
  ]
  const remote = [
    { uri: uri("bbbbbbbbbbbbb"), value: record("Old") },
    { uri: uri("ccccccccccccc"), value: { title: "Same", site, $type: "site.standard.document" } },
    { uri: uri("ddddddddddddd"), value: record("Theirs", "https://elsewhere.test") },
    { uri: uri("eeeeeeeeeeeee"), value: record("Gone") },
    { uri: uri("fffffffffffff"), value: record("Another site's", "https://elsewhere.test") }
  ]
  const plan = planWrites(local, remote, new Set([site]))
  const byKey = Object.fromEntries(plan.map(write => [write.rkey[0], write.action]))
  assert.deepEqual(byKey, { a: "create", b: "update", c: "unchanged", d: "collision", e: "delete" })
})

/**
 * A PDS with one repo, enough of XRPC for the publish command: paged
 * listRecords (two per page, so paging is exercised), createSession,
 * uploadBlob, and applyWrites behind a bearer token. `records` is keyed
 * `<collection>/<rkey>`. A record naming a blob that was never uploaded is
 * refused, as a real PDS refuses it. `calls` records what was asked.
 */
async function withPDS(run) {
  const records = new Map()
  const blobs = new Set()
  const calls = []
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://pds.test")
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks)
    const json = req.headers["content-type"] === "application/json"
    const body = chunks.length && json ? JSON.parse(raw.toString()) : undefined
    const nsid = url.pathname.replace("/xrpc/", "")
    calls.push(nsid)
    const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)) }

    if (nsid === "com.atproto.repo.listRecords") {
      const prefix = `${url.searchParams.get("collection")}/`
      const keys = [...records.keys()].filter(key => key.startsWith(prefix)).sort()
      const start = Number(url.searchParams.get("cursor") ?? 0)
      const page = keys.slice(start, start + 2)
      const next = start + 2 < keys.length ? String(start + 2) : undefined
      return send(200, { records: page.map(key => ({ uri: `at://${DID}/${key}`, cid: "x", value: records.get(key) })), ...(next ? { cursor: next } : {}) })
    }
    if (nsid === "com.atproto.repo.uploadBlob") {
      if (req.headers.authorization !== "Bearer token") return send(401, { error: "AuthenticationRequired" })
      const cid = blobCID(raw)
      blobs.add(cid)
      return send(200, { blob: { $type: "blob", ref: { $link: cid }, mimeType: req.headers["content-type"], size: raw.length } })
    }
    if (nsid === "com.atproto.server.createSession") {
      if (body.password !== "app-password") return send(401, { error: "AuthenticationRequired", message: "Invalid identifier or password" })
      return send(200, { did: body.identifier, accessJwt: "token" })
    }
    if (nsid === "com.atproto.repo.applyWrites") {
      if (req.headers.authorization !== "Bearer token") return send(401, { error: "AuthenticationRequired" })
      const missing = body.writes.map(write => write.value?.icon?.ref?.$link).filter(cid => cid && !blobs.has(cid))
      if (missing.length) return send(400, { error: "InvalidRequest", message: `Could not find blob: ${missing[0]}` })
      for (const write of body.writes) {
        const key = `${write.collection}/${write.rkey}`
        if (write.$type.endsWith("#delete")) records.delete(key)
        else records.set(key, write.value)
      }
      return send(200, {})
    }
    send(404, { error: "MethodNotImplemented" })
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const pds = `http://127.0.0.1:${server.address().port}`
  try {
    await run({ pds, records, calls })
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
}

test("atproto-publish: dry run, create, nothing to send, update, delete - and another site's record is never touched", async () => {
  const publish = vowelAtprotoPlugin.commands["atproto-publish"]
  const notify = () => {}
  const previous = process.env.ATPROTO_APP_PASSWORD
  process.env.ATPROTO_APP_PASSWORD = "app-password"
  try {
    await withPDS(async ({ pds, records, calls }) => {
      records.set("site.standard.document/zzzzzzzzzzzzz", { $type: "site.standard.document", site: "https://elsewhere.test", title: "Not ours" })

      await withProject({
        "settings.md": rootSettings({ pds }),
        "blog/one.md": "---\ndate: 2026-03-04\n---\n# One\n",
        "blog/two.md": "---\ndate: 2026-03-05\n---\n# Two\n",
        "blog/three.md": "---\ndate: 2026-03-06\n---\n# Three\n"
      }, async ({ sourceFolder, config }) => {
        const dry = await publish({ dryRun: true }, { config, notify })
        assert.equal(dry.created, 3)
        assert.ok(!calls.includes("com.atproto.server.createSession") && !calls.includes("com.atproto.repo.applyWrites"), "a dry run sends nothing")

        const first = await publish({}, { config, notify })
        assert.deepEqual([first.created, first.updated, first.deleted, first.publication], [3, 0, 0, "create"])
        assert.equal(records.size, 5, "three documents, the publication, and another site's document")

        calls.length = 0
        const again = await publish({}, { config, notify })
        assert.deepEqual([again.created, again.updated, again.deleted, again.unchanged, again.publication], [0, 0, 0, 3, "unchanged"])
        assert.ok(!calls.includes("com.atproto.repo.applyWrites"), "an unchanged site sends nothing")

        await writeFile(path.join(sourceFolder, "blog", "two.md"), "---\ndate: 2026-03-05\n---\n# Two, edited\n")
        await rm(path.join(sourceFolder, "blog", "three.md"))
        const edited = await publish({}, { config, notify })
        assert.deepEqual([edited.created, edited.updated, edited.deleted], [0, 1, 1])
        assert.equal(records.size, 4)
        assert.ok(records.has("site.standard.document/zzzzzzzzzzzzz"), "another site's record is left alone")
        assert.ok([...records.values()].some(value => value.title === "Two, edited"))
      })
    })
  } finally {
    if (previous === undefined) delete process.env.ATPROTO_APP_PASSWORD
    else process.env.ATPROTO_APP_PASSWORD = previous
  }
})

test("atproto-publish refuses without a domain, and names a wrong app password", async () => {
  const publish = vowelAtprotoPlugin.commands["atproto-publish"]
  const notify = () => {}
  await withPDS(async ({ pds }) => {
    await withProject({
      "settings.md": `---\nname: T\natproto_did: ${DID}\natproto_pds: ${pds}\natproto_lexicon: site.standard.document\n---\n`
    }, async ({ config }) => {
      await assert.rejects(() => publish({}, { config, notify }), /set domain/)
    })

    const previous = process.env.ATPROTO_APP_PASSWORD
    process.env.ATPROTO_APP_PASSWORD = "wrong"
    try {
      await withProject({
        "settings.md": rootSettings({ pds }),
        "post.md": "---\ndate: 2026-03-04\n---\n# Post\n"
      }, async ({ config }) => {
        await assert.rejects(() => publish({}, { config, notify }), /createSession: 401 AuthenticationRequired/)
      })
    } finally {
      if (previous === undefined) delete process.env.ATPROTO_APP_PASSWORD
      else process.env.ATPROTO_APP_PASSWORD = previous
    }
  })
})

test("the publication: its AT-URI at /.well-known/site.standard.publication, named by every document", async () => {
  await withProject({
    "settings.md": rootSettings(),
    "post.md": "---\ndate: 2026-03-04\n---\n# Post\n"
  }, async ({ targetFolder, records }) => {
    const uri = publicationURI(DID, "https://example.com")
    assert.match(uri, new RegExp(`^at://${DID}/site\\.standard\\.publication/`))
    assert.match(uri.split("/").at(-1), TID)
    assert.equal(await readFile(path.join(targetFolder, ".well-known", "site.standard.publication"), "utf-8"), uri)
    assert.equal(records().get("post.md").record.site, uri)
    assert.equal(records().get("post.md").atUri, `at://${DID}/site.standard.document/${createRkey("https://example.com/post")}`, "a document's key is still its URL")
  })
  await withProject({
    "settings.md": `---\natproto_did: ${DID}\n---\n`
  }, async ({ targetFolder }) => {
    await assert.rejects(access(path.join(targetFolder, ".well-known", "site.standard.publication")), "no domain, no publication")
  })
})

test("atproto_publication: description is text, icon is a path resolved like any other", () => {
  const problems = []
  const read = (value) => coerce({ atproto_publication: value }, "blog/settings.md", "blog", message => problems.push(message)).atproto_publication
  assert.deepEqual(read({ description: "Notes", icon: "./mark.png" }), { description: "Notes", icon: "/blog/mark.png" })
  assert.deepEqual(read({ icon: "Mark.PNG" }), { icon: "/mark.png" })
  assert.equal(problems.length, 0)
  assert.deepEqual(read({ description: 4, icon: "" }), {})
  assert.equal(read("Notes"), undefined)
  assert.equal(problems.length, 2)
})

test("planPublication: create, unchanged, update", () => {
  const value = { $type: "site.standard.publication", url: "https://example.com", name: "T" }
  const uri = `at://${DID}/site.standard.publication/aaaaaaaaaaaaa`
  assert.equal(planPublication([], "aaaaaaaaaaaaa", value).action, "create")
  assert.equal(planPublication([{ uri, value: { name: "T", url: "https://example.com", $type: "site.standard.publication" } }], "aaaaaaaaaaaaa", value).action, "unchanged")
  assert.equal(planPublication([{ uri, value: { ...value, name: "Old" } }], "aaaaaaaaaaaaa", value).action, "update")
})

test("atproto-publish: the publication's icon defaults to logo, is uploaded once, and a new atproto_publication icon replaces it", async () => {
  const publish = vowelAtprotoPlugin.commands["atproto-publish"]
  const notify = () => {}
  const previous = process.env.ATPROTO_APP_PASSWORD
  process.env.ATPROTO_APP_PASSWORD = "app-password"
  const square = (color) => sharp({ create: { width: 64, height: 32, channels: 4, background: color } }).png().toBuffer()
  try {
    await withPDS(async ({ pds, records, calls }) => {
      const settings = (extra) => rootSettings({ pds }).replace(/---\n$/, "") + extra + "---\n"
      await withProject({
        "settings.md": settings("logo: logo.png\n"),
        "logo.png": await square("#ff0000"),
        "mark.png": await square("#0000ff"),
        "post.md": "---\ndate: 2026-03-04\n---\n# Post\n"
      }, async ({ sourceFolder, config }) => {
        const key = `site.standard.publication/${publicationURI(DID, "https://example.com").split("/").at(-1)}`

        const first = await publish({}, { config, notify })
        assert.equal(first.publication, "create")
        const created = records.get(key)
        assert.equal(created.url, "https://example.com")
        assert.equal(created.name, "T")
        assert.equal(created.description, undefined)
        assert.equal(created.icon.mimeType, "image/png")
        assert.ok(created.icon.size <= 1_000_000)
        assert.equal(calls.filter(nsid => nsid === "com.atproto.repo.uploadBlob").length, 1)

        calls.length = 0
        const again = await publish({}, { config, notify })
        assert.equal(again.publication, "unchanged")
        assert.ok(!calls.includes("com.atproto.repo.uploadBlob"), "an unchanged icon is not uploaded again")

        await writeFile(path.join(sourceFolder, "settings.md"), settings("logo: logo.png\natproto_publication:\n  description: Small things\n  icon: mark.png\n"))
        const edited = await publish({}, { config, notify })
        assert.equal(edited.publication, "update")
        const updated = records.get(key)
        assert.equal(updated.description, "Small things")
        assert.notEqual(updated.icon.ref.$link, created.icon.ref.$link, "the new icon")
        const document = [...records.entries()].find(([k]) => k.startsWith("site.standard.document/"))[1]
        assert.equal(document.site, publicationURI(DID, "https://example.com"))
      })
    })
  } finally {
    if (previous === undefined) delete process.env.ATPROTO_APP_PASSWORD
    else process.env.ATPROTO_APP_PASSWORD = previous
  }
})

test("atproto-password: checks the password against atproto_did, saves it owner-only where publish reads it, and refuses a wrong one", async () => {
  const save = vowelAtprotoPlugin.commands["atproto-password"]
  const notify = () => {}
  await withPDS(async ({ pds, calls }) => {
    await withProject({ "settings.md": rootSettings({ pds }) }, async ({ config }) => {
      const file = passwordFile(config.sourceFolder)
      try {
        await assert.rejects(() => save({ password: "wrong" }, { config, notify }), /401/)
        await assert.rejects(stat(file), "a refused password is not saved")

        const result = await save({ password: " app-password " }, { config, notify })
        assert.deepEqual(result, { saved: file, verified: true })
        assert.ok(calls.includes("com.atproto.server.createSession"))
        assert.equal(await readFile(file, "utf-8"), "app-password")
        if (process.platform !== "win32") assert.equal((await stat(file)).mode & 0o777, 0o600)
      } finally {
        await rm(path.dirname(file), { recursive: true, force: true })
      }
    })
  })
})

test("atproto-password: with no atproto_did it saves unchecked; with no terminal and no payload it says what to pass", async () => {
  const save = vowelAtprotoPlugin.commands["atproto-password"]
  await withProject({ "settings.md": "---\nname: T\n---\n" }, async ({ config }) => {
    const file = passwordFile(config.sourceFolder)
    try {
      const messages = []
      assert.deepEqual(await save({ password: "p" }, { config, notify: m => messages.push(m.message) }), { saved: file, verified: false })
      assert.ok(messages.some(m => /not checked/.test(m)))
      if (!process.stdin.isTTY) {
        await assert.rejects(() => save(undefined, { config, notify: () => {} }), /\{"password"/)
      }
    } finally {
      await rm(path.dirname(file), { recursive: true, force: true })
    }
  })
})
