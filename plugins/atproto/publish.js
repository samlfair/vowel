import { createHash } from "node:crypto"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { systemDirectoryFor } from "../../systemPaths.js"
import { EXPECTED } from "../markdown/frontmatter.js"
import { contentSection } from "../xml/entryContent.js"
import { PUBLICATION, siteOrigin, publicationURI, pageRecordURI } from "./record.js"
import { createLexiconResolver, resolvePDS } from "./lexicons.js"
import { mapRecord } from "./mapper.js"
import { markdownBody, richTextBody } from "./body.js"

/**
 * `vowel --command atproto-publish`: make the account's records match the
 * site's pages.
 *
 * The command builds the site, fetches every lexicon a page names
 * (lexicons.js; cached in memory), fits each page to its lexicon
 * (mapper.js), lists what the PDS holds in each collection, and sends the
 * difference through `applyWrites`: a record the PDS doesn't have is
 * created, one that differs is updated. Nothing is remembered between
 * runs, so clearing a cache cannot cause a resend, a revert publishes,
 * and a coworker sees the same state.
 *
 * **Vowel owns only the records it creates** - the ones at keys it
 * derives from the site's page URLs (rkey.js). It never deletes one on
 * its own: a record whose page is gone can't be told from anyone else's,
 * because its key can no longer be derived. A page with
 * `status: deleted` is how a record is deleted - the page stays in the
 * project, unwritten, so its key can still be derived.
 *
 * A page that doesn't fit its lexicon - a required property with no
 * value, a lexicon that isn't published - is left out with a warning.
 *
 * The build uses a throwaway database, so every page is read and every
 * transform runs against current settings. A transform only re-runs when
 * its source is re-read (tasks/1-proposed/transform-reruns-on-stale.md),
 * so a warm database could hold records built from old settings.
 *
 * **The publication goes first**, when any page publishes to
 * `site.standard.*`: standard.site defines a document's `site` as its
 * publication. One `site.standard.publication` per site, at the key
 * record.js derives from the origin: `url` from `domain:`, `name` from
 * the root `name:` (else the homepage's title), and `description` and
 * `icon` from the root's `atproto_publication:`. The icon defaults to
 * `logo:`. It is rendered to a 512px square PNG and its blob reference -
 * CID, type, size - computed here, so an unchanged icon compares equal
 * and is never uploaded again; a changed one is uploaded just before the
 * write that names it. The publication is created and updated, never
 * deleted.
 *
 * The app password comes from `ATPROTO_APP_PASSWORD`, or from a file
 * named `atproto-app-password` in the project's system directory, never
 * from the project. Payload: `{"dryRun": true}` reports what would change
 * and sends nothing, and does not need the password. `{"optional": true}`
 * makes a site with no `atproto_did` a skip rather than an error, for
 * the `publish` command, which runs this after every deploy.
 *
 * `config.atprotoLexicons` replaces the lexicon resolver - for tests,
 * which can't publish a DNS record.
 */

const PASSWORD_FILE = "atproto-app-password"
const PAGE_SIZE = 100
const BATCH_SIZE = 100
const TIMEOUT = 30_000
const ICON_SIZE = 512
// The lexicon's maxSize for `icon`.
const ICON_MAX_BYTES = 1_000_000
const BASE32 = "abcdefghijklmnopqrstuvwxyz234567"

/**
 * RFC 4648 base32, lowercase, unpadded: the multibase `b` alphabet.
 * @param {Uint8Array} bytes
 */
function base32(bytes) {
  const bits = [...bytes].map(byte => byte.toString(2).padStart(8, "0")).join("")
  const padded = bits.padEnd(Math.ceil(bits.length / 5) * 5, "0")
  return padded.match(/.{5}/g).map(chunk => BASE32[parseInt(chunk, 2)]).join("")
}

/**
 * The CID a PDS gives a blob: CIDv1, raw codec (0x55), sha2-256.
 * @param {Uint8Array} bytes
 */
function blobCID(bytes) {
  const digest = createHash("sha256").update(bytes).digest()
  return "b" + base32(Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]))
}

/**
 * The publication's icon: a 512px square PNG, the image contained in it
 * on transparency, and the blob reference a PDS will give it. An SVG is
 * rasterised at a density high enough to stay sharp at that size.
 * @param {Buffer} source
 * @param {string} iconPath - for the error message
 */
async function iconBlob(source, iconPath) {
  const bytes = await sharp(source, { density: 300 })
    .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  if (bytes.length > ICON_MAX_BYTES) {
    throw new Error(`atproto: the publication icon ${iconPath} is ${bytes.length} bytes as a ${ICON_SIZE}px PNG; the limit is ${ICON_MAX_BYTES}`)
  }
  const ref = { $type: "blob", ref: { $link: blobCID(bytes) }, mimeType: "image/png", size: bytes.length }
  return { bytes, ref }
}

/**
 * A value with its object keys sorted, so two records compare by content
 * and not by key order.
 * @param {unknown} value
 * @returns {unknown}
 */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== "object") return value
  const keys = Object.keys(value).sort()
  return Object.fromEntries(keys.map(key => [key, canonical(value[key])]))
}

/** @param {unknown} a @param {unknown} b */
function sameRecord(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}

/**
 * One XRPC call. An error response throws with the PDS's own error name
 * and message, which is the only useful part of a failed write.
 * @param {string} pds
 * @param {string} nsid
 * `bytes` is a raw body (uploadBlob) of type `mimeType`; `body` is JSON.
 * @param {{ query?: Record<string, string>, body?: unknown, bytes?: Uint8Array, mimeType?: string, token?: string }} [options]
 */
async function xrpc(pds, nsid, { query, body, bytes, mimeType, token } = {}) {
  const url = new URL(`/xrpc/${nsid}`, pds)
  const params = new URLSearchParams(query ?? {})
  url.search = params.toString()
  const payload = bytes ?? (body === undefined ? undefined : JSON.stringify(body))
  const headers = {
    ...(bytes ? { "content-type": mimeType } : body === undefined ? {} : { "content-type": "application/json" }),
    ...(token ? { authorization: `Bearer ${token}` } : {})
  }
  const response = await fetch(url, {
    method: payload === undefined ? "GET" : "POST",
    headers,
    body: payload,
    signal: AbortSignal.timeout(TIMEOUT)
  })
  const text = await response.text()
  const json = text ? JSON.parse(text) : {}
  if (response.ok) return json
  throw new Error(`${nsid}: ${response.status} ${json.error ?? ""} ${json.message ?? ""}`.trim())
}

/**
 * Where the app password is kept: the project's system directory, never
 * the project, so it is neither committed nor deployed.
 * @param {string} sourceFolder
 */
function passwordFile(sourceFolder) {
  return path.join(systemDirectoryFor(sourceFolder), PASSWORD_FILE)
}

/** @param {string} sourceFolder */
async function appPassword(sourceFolder) {
  if (process.env.ATPROTO_APP_PASSWORD) return process.env.ATPROTO_APP_PASSWORD
  const file = passwordFile(sourceFolder)
  const text = await readFile(file, "utf-8").catch(() => "")
  if (text.trim()) return text.trim()
  throw new Error(`atproto: no app password. Set ATPROTO_APP_PASSWORD, or put one in ${file}`)
}

/**
 * Every record in `collection`, a page at a time.
 * @param {string} pds
 * @param {string} did
 * @param {string} collection
 * @param {string} [cursor]
 * @returns {Promise<{ uri: string, value: any }[]>}
 */
async function listAll(pds, did, collection, cursor) {
  const query = { repo: did, collection, limit: String(PAGE_SIZE), ...(cursor ? { cursor } : {}) }
  const page = await xrpc(pds, "com.atproto.repo.listRecords", { query })
  const records = page.records ?? []
  if (!page.cursor || !records.length) return records
  const rest = await listAll(pds, did, collection, page.cursor)
  return [...records, ...rest]
}

/** The last segment of an AT-URI. @param {string} uri */
const rkeyOf = (uri) => uri.slice(uri.lastIndexOf("/") + 1)

/**
 * The default `$type` for a body that goes into an open union - a
 * `content` any lexicon may fill, like standard.site's. MarkPub's
 * markdown lexicon, fetched and interpreted like any other; a folder's
 * `atproto_content:` names another.
 */
const CONTENT_LEXICON = "at.markpub.markdown"

/**
 * The page as mapper.js reads it: its title, description, date, image
 * and tags, the frontmatter keys that are the author's own (every key
 * vowel reads for itself is left out), and its body - both forms, made
 * only when asked for, from the rendered page. Every value is read now:
 * a target's properties are lazy database reads, and the build's
 * database is closed before anything is mapped.
 * @param {any} target
 * @param {string} pageURL
 */
function pageFor(target, pageURL) {
  const { metadata } = target
  const declared = Array.isArray(metadata.frontmatter_keys) ? metadata.frontmatter_keys : []
  const frontmatter = Object.fromEntries(declared
    .filter(key => !(key in EXPECTED) && `fm_${key}` in metadata)
    .map(key => [key, metadata[`fm_${key}`]]))
  const html = target.data
  const section = () => contentSection(html)
  return {
    title: metadata.title,
    description: metadata.description,
    date: metadata.date,
    image: metadata.image,
    tags: metadata.tags,
    frontmatter,
    markdown: () => markdownBody(section(), pageURL),
    richText: (features) => richTextBody(section(), pageURL, features)
  }
}

/**
 * The folder whose settings a page reads: the page as a folder -
 * `blog/post.html` → `blog/post` - which is what votive hands a write
 * (`pageSettingsFolder` in votive's lib/utils, not exported), so publish
 * sees each page's lexicon exactly as its write did. `index.html` is
 * `/index` there, and here.
 * @param {string} targetPath
 */
function pageSettingsFolder(targetPath) {
  const segments = targetPath.split("/").filter(Boolean)
  const folder = path.relative("", [...segments.slice(0, -1), ""].join(path.sep))
  return folder + path.sep + path.parse(targetPath).name
}

/**
 * Every page under a lexicon, with its AT-URI: the author's own pages -
 * a generated one (a tag page, a folder index, the default home or 404)
 * is a stub, and inherits a folder's lexicon without being anything to
 * publish.
 * @param {any} database - a built site's
 * @returns {{ target: any, uri: string }[]}
 */
function recordPages(database) {
  const stubs = new Set(database.source.getStubs().map(row => row.path))
  return database.target.getAll()
    .filter(target => target.extension === ".html" && !stubs.has(target.source))
    .map(target => ({ target, uri: pageRecordURI(target, database.setting.getByFolder(pageSettingsFolder(target.path))).uri }))
    .filter(page => typeof page.uri === "string")
}

/**
 * What the site should hold: every page under a lexicon - its AT-URI,
 * its status, and what mapper.js reads - the site's own settings, and
 * the publication's name, description and icon. The icon is read from
 * the build's output - it is a URL path from the root (frontmatter.js
 * resolves it), which is where the output has it. Built into a scratch
 * folder that is removed afterwards.
 * @param {import("votive").VotiveConfig} config
 */
async function collectPages(config) {
  const scratch = await mkdtemp(path.join(tmpdir(), "vowel-atproto-"))
  try {
    const site = await votive({
      ...config,
      verbose: false,
      databasePath: path.join(scratch, ".votive.db"),
      targetFolder: path.join(scratch, "output")
    })
    try {
      await (await site.build({ defer: false })).deferred
      const root = site.database.setting.getByFolder("")
      const did = root.lastNonNull("fm_atproto_did")
      const pds = root.lastNonNull("fm_atproto_pds")
      const domain = root.lastNonNull("fm_domain")
      const origin = siteOrigin(domain)
      const pages = recordPages(site.database).map(({ target, uri }) => {
        const [, , account, collection, rkey] = uri.split("/")
        const pageURL = new URL(target.metadata.prettyURL, origin).href
        const contentLexicon = site.database.setting.getByFolder(target.dir).lastNonNull("fm_atproto_content")
        return {
          path: target.path,
          account,
          collection,
          rkey,
          deleted: target.metadata.fm_status === "deleted",
          context: { origin, pageURL, path: target.metadata.prettyURL, contentLexicon: typeof contentLexicon === "string" && contentLexicon ? contentLexicon : CONTENT_LEXICON },
          page: target.metadata.fm_status === "deleted" ? undefined : pageFor(target, pageURL)
        }
      })

      const settings = root.lastNonNull("fm_atproto_publication") ?? {}
      const home = site.database.target.get("index.html")
      const name = root.raw("fm_name")?.[0]?.at(-1) ?? (home?.source ? home.metadata.title : undefined)
      const iconPath = settings.icon ?? root.lastNonNull("logo")
      const icon = iconPath ? await readIcon(path.join(scratch, "output"), iconPath) : undefined
      const publication = { name, description: settings.description, iconPath, icon }
      return { did, pds, domain, pages, publication }
    } finally {
      await site.close()
    }
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

/**
 * The icon's bytes from the build output. A URL is not fetched: the icon
 * has to be a file in the project.
 * @param {string} output
 * @param {string} iconPath - a URL path from the root, e.g. "/logo.svg"
 */
async function readIcon(output, iconPath) {
  if (/^[a-z]+:/i.test(iconPath)) {
    throw new Error(`atproto: the publication icon must be a file in the project, not ${iconPath}`)
  }
  const file = path.join(output, ...iconPath.split("/").filter(Boolean))
  return readFile(file).catch(() => {
    throw new Error(`atproto: the publication icon ${iconPath} is not in the built site`)
  })
}

/**
 * The publication's write: create, update or unchanged, against what the
 * account holds at its key.
 * @param {{ uri: string, value: any }[]} remote - the account's publications
 * @param {string} rkey
 * @param {Record<string, unknown>} value
 */
function planPublication(remote, rkey, value) {
  const existing = remote.find(record => rkeyOf(record.uri) === rkey)
  if (!existing) return { action: "create", rkey, value }
  if (sameRecord(existing.value, value)) return { action: "unchanged", rkey }
  return { action: "update", rkey, value }
}

/**
 * The writes that make the account match the site. `local` is the
 * records the pages make, `deleted` the keys of pages whose status is
 * `deleted`; `remote` is what the PDS holds in those collections, keyed
 * `<collection>/<rkey>`. A record the PDS doesn't hold is created, one
 * that differs is updated, and a deleted page's record is deleted if it
 * is there. Nothing else in a collection is touched.
 * @param {{ collection: string, rkey: string, value: unknown }[]} local
 * @param {{ collection: string, rkey: string }[]} deleted
 * @param {Map<string, unknown>} remote
 */
function planWrites(local, deleted, remote) {
  const compared = local.map(({ collection, rkey, value }) => {
    const existing = remote.get(`${collection}/${rkey}`)
    if (existing === undefined) return { action: "create", collection, rkey, value }
    if (sameRecord(existing, value)) return { action: "unchanged", collection, rkey }
    return { action: "update", collection, rkey, value }
  })
  const deletions = deleted
    .filter(({ collection, rkey }) => remote.has(`${collection}/${rkey}`))
    .map(({ collection, rkey }) => ({ action: "delete", collection, rkey }))
  return [...compared, ...deletions]
}

/** @param {{ action: string, collection: string, rkey: string, value?: unknown }} write */
function applyWrite({ action, collection, rkey, value }) {
  const base = { $type: `com.atproto.repo.applyWrites#${action}`, collection, rkey }
  return action === "delete" ? base : { ...base, value }
}

const defaultResolver = createLexiconResolver()

/**
 * @param {{ dryRun?: boolean, optional?: boolean } | undefined} payload
 * @param {{ config: import("votive").VotiveConfig & { atprotoLexicons?: ReturnType<typeof createLexiconResolver> }, notify: (message: object) => void }} context
 */
async function publishToAtproto(payload, { config, notify }) {
  const dryRun = Boolean(payload?.dryRun)
  // A command's config comes straight from the caller and may carry no
  // logger; votive() adds one only to the config its hooks receive.
  const log = config.log ?? ((level, message) => console.error(message))

  notify({ status: "progress", message: "Building..." })
  const { did, pds: configuredPDS, domain, pages, publication } = await collectPages(config)

  if ((typeof did !== "string" || !did) && payload?.optional) {
    notify({ status: "done", message: "No atproto_did in settings.md; nothing to publish to AT Protocol" })
    return { skipped: true }
  }
  if (typeof did !== "string" || !did) throw new Error("atproto: set atproto_did in the root settings.md")
  const origin = siteOrigin(domain)
  if (!origin) throw new Error("atproto: set domain in the root settings.md; every record carries the site's url")

  const others = [...new Set(pages.map(page => page.account))].filter(account => account !== did)
  if (others.length) throw new Error(`atproto: pages name ${others.join(", ")}; one site publishes to one account (${did})`)

  // The publication, only for a site that publishes to standard.site.
  const live = pages.filter(page => !page.deleted)
  const standardSite = live.some(page => page.collection.startsWith("site.standard."))
  if (standardSite && (typeof publication.name !== "string" || !publication.name)) {
    throw new Error("atproto: set name in the root settings.md; the publication needs one")
  }
  const publicationURL = standardSite ? publicationURI(did, origin) : undefined

  notify({ status: "progress", message: "Fetching lexicons..." })
  const resolver = config.atprotoLexicons ?? defaultResolver
  const roots = [...new Set(live.flatMap(page => [page.collection, page.context.contentLexicon]))]
  const { lexicons, errors } = await resolver.load(roots)

  const mapped = live.map(page => {
    const context = { ...page.context, publication: publicationURL }
    const unresolved = errors.get(page.collection)
    const result = unresolved ? { ignored: unresolved, warnings: [] } : mapRecord(page.collection, page.page, { lexicons, context })
    result.warnings.forEach(warning => log("warn", `${page.path}: ${warning}`))
    if ("ignored" in result) log("warn", `${page.path}: not published to AT Protocol: ${result.ignored}`)
    return { page, result }
  })
  const local = mapped
    .filter(({ result }) => "record" in result)
    .map(({ page, result }) => ({ collection: page.collection, rkey: page.rkey, value: result.record }))
  const deleted = pages.filter(page => page.deleted).map(({ collection, rkey }) => ({ collection, rkey }))

  const icon = standardSite && publication.icon ? await iconBlob(publication.icon, publication.iconPath) : undefined
  const publicationRecord = standardSite ? {
    $type: PUBLICATION,
    url: origin,
    name: publication.name,
    ...(typeof publication.description === "string" && publication.description ? { description: publication.description } : {}),
    ...(icon ? { icon: icon.ref } : {})
  } : undefined

  const pds = typeof configuredPDS === "string" && configuredPDS ? configuredPDS : await resolvePDS(did)

  const collections = [...new Set([...local, ...deleted].map(record => record.collection))]
  notify({ status: "progress", message: `Comparing ${local.length} records with ${pds}...` })
  const listed = await Promise.all(collections.map(collection => listAll(pds, did, collection)))
  const remote = new Map(listed.flatMap((records, index) => records.map(record => [`${collections[index]}/${rkeyOf(record.uri)}`, record.value])))
  const plan = planWrites(local, deleted, remote)
  const publicationWrite = publicationRecord
    ? planPublication(await listAll(pds, did, PUBLICATION), rkeyOf(publicationURL), publicationRecord)
    : { action: "none" }

  const count = (action) => plan.filter(write => write.action === action).length
  const summary = {
    created: count("create"),
    updated: count("update"),
    deleted: count("delete"),
    unchanged: count("unchanged"),
    ignored: mapped.filter(({ result }) => "ignored" in result).length,
    publication: publicationWrite.action,
    dryRun
  }

  const publicationWrites = ["create", "update"].includes(publicationWrite.action) ? [{ ...publicationWrite, collection: PUBLICATION }] : []
  const recordWrites = plan.filter(write => ["create", "update", "delete"].includes(write.action))
  const writes = [...publicationWrites, ...recordWrites].map(applyWrite)
  if (dryRun || !writes.length) {
    notify({ status: "done", message: `${dryRun ? "Would send" : "Nothing to send"}: ${JSON.stringify(summary)}` })
    return summary
  }

  const password = await appPassword(config.sourceFolder)
  const session = await xrpc(pds, "com.atproto.server.createSession", { body: { identifier: did, password } })
  if (session.did !== did) throw new Error(`atproto: the app password is for ${session.did}, not ${did}`)

  // The icon is uploaded only when the publication is written - which is
  // when its reference changed, or the record is new.
  if (icon && publicationWrites.length) {
    notify({ status: "progress", message: "Uploading the publication icon..." })
    const uploaded = await xrpc(pds, "com.atproto.repo.uploadBlob", { bytes: icon.bytes, mimeType: icon.ref.mimeType, token: session.accessJwt })
    if (uploaded.blob?.ref?.$link !== icon.ref.ref.$link) {
      throw new Error(`atproto: the PDS gave the icon ${uploaded.blob?.ref?.$link}, not the ${icon.ref.ref.$link} computed for it; nothing was written`)
    }
  }

  const batches = Array.from({ length: Math.ceil(writes.length / BATCH_SIZE) }, (_, index) =>
    writes.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE))
  for (const [index, batch] of batches.entries()) {
    notify({ status: "progress", message: `Sending batch ${index + 1} of ${batches.length}...` })
    await xrpc(pds, "com.atproto.repo.applyWrites", { body: { repo: did, writes: batch }, token: session.accessJwt })
  }

  notify({ status: "done", message: `Published: ${JSON.stringify(summary)}` })
  return summary
}

export { publishToAtproto, recordPages, pageSettingsFolder, planWrites, planPublication, sameRecord, resolvePDS, blobCID, xrpc, passwordFile }
