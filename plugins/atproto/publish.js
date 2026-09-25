import { createHash } from "node:crypto"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { systemDirectoryFor } from "../../systemPaths.js"
import { DOCUMENT, PUBLICATION, siteOrigin, publicationURI } from "./record.js"

/**
 * `vowel --command atproto-publish`: make the account's records match the
 * site.
 *
 * The PDS is the ledger. The command builds the site, collects the record
 * each page's transform stored (`metadata.atprotoRecord`), lists what the
 * PDS holds, and sends the difference through `applyWrites`: a record the
 * site has and the PDS does not is created, one that differs is updated,
 * and one the PDS has for this site and the site no longer produces is
 * deleted. Nothing is remembered between runs, so clearing a cache
 * cannot cause a resend, a revert publishes, and a coworker sees the
 * same state.
 *
 * **Only this site's records are ever deleted.** `listRecords` returns
 * every record in the collection, including ones another site or app
 * published to the same account. A record is this site's when its `site`
 * is this site's origin. A record at one of our keys with another `site`
 * is a collision; it is reported and left alone.
 *
 * The build uses a throwaway database, so every page is read and every
 * transform runs against current settings. A transform only re-runs when
 * its source is re-read (tasks/1-proposed/transform-reruns-on-stale.md),
 * so a warm database could hold records built from old settings.
 *
 * **The publication goes first.** One `site.standard.publication` per
 * site, at the key record.js derives from the origin: `url` from
 * `domain:`, `name` from the root `name:` (else the homepage's title),
 * and `description` and `icon` from the root's `atproto_publication:`.
 * The icon defaults to `logo:`. It is rendered to a 512px square PNG and
 * its blob reference - CID, type, size - computed here, so an unchanged
 * icon compares equal and is never uploaded again; a changed one is
 * uploaded just before the write that names it. The publication is
 * created and updated, never deleted.
 *
 * The app password comes from `ATPROTO_APP_PASSWORD`, or from a file
 * named `atproto-app-password` in the project's system directory, never
 * from the project. Payload: `{"dryRun": true}` reports what would change
 * and sends nothing, and does not need the password. `{"optional": true}`
 * makes a site with no `atproto_did` a skip rather than an error, for
 * the `publish` command, which runs this after every deploy.
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
 * The PDS that hosts `did`, from its DID document. `did:plc` is resolved
 * through the PLC directory, `did:web` through its own host.
 * @param {string} did
 */
async function resolvePDS(did) {
  const documentURL = did.startsWith("did:plc:")
    ? `https://plc.directory/${did}`
    : did.startsWith("did:web:")
      ? `https://${decodeURIComponent(did.slice("did:web:".length))}/.well-known/did.json`
      : undefined
  if (!documentURL) throw new Error(`atproto: can't resolve ${did}; set atproto_pds in settings.md`)

  const response = await fetch(documentURL, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!response.ok) throw new Error(`atproto: resolving ${did} failed: ${response.status}`)
  const document = await response.json()
  const service = (document.service ?? []).find(entry => entry.id === "#atproto_pds" || entry.id === `${did}#atproto_pds`)
  if (!service) throw new Error(`atproto: ${did} names no PDS`)
  return service.serviceEndpoint
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
 * What the site should hold: every stored record, by rkey, the site's
 * own settings, and the publication's name, description and icon. The
 * icon is read from the build's output - it is a URL path from the root
 * (frontmatter.js resolves it), which is where the output has it. Built
 * into a scratch folder that is removed afterwards.
 * @param {import("votive").VotiveConfig} config
 */
async function collectRecords(config) {
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
      const targets = site.database.target.getAll()
      const pages = targets.filter(target => "atUri" in target.metadata && "atprotoRecord" in target.metadata)
      const records = pages.map(target => ({ uri: target.metadata.atUri, value: target.metadata.atprotoRecord }))

      const settings = root.lastNonNull("fm_atproto_publication") ?? {}
      const home = site.database.target.get("index.html")
      const name = root.raw("fm_name")?.[0]?.at(-1) ?? (home?.source ? home.metadata.title : undefined)
      const iconPath = settings.icon ?? root.lastNonNull("logo")
      const icon = iconPath ? await readIcon(path.join(scratch, "output"), iconPath) : undefined
      const publication = { name, description: settings.description, iconPath, icon }
      return { did, pds, domain, records, publication }
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
 * The writes that make `remote` match `local`, plus the collisions.
 * @param {{ uri: string, value: any }[]} local
 * @param {{ uri: string, value: any }[]} remote
 * @param {Set<string>} sites - the `site` values that are this site's
 */
function planWrites(local, remote, sites) {
  const remoteByKey = new Map(remote.map(record => [rkeyOf(record.uri), record]))
  const localKeys = new Set(local.map(record => rkeyOf(record.uri)))

  const compared = local.map(record => {
    const rkey = rkeyOf(record.uri)
    const existing = remoteByKey.get(rkey)
    if (!existing) return { action: "create", rkey, value: record.value }
    if (!sites.has(existing.value?.site)) return { action: "collision", rkey, site: existing.value?.site }
    if (sameRecord(existing.value, record.value)) return { action: "unchanged", rkey }
    return { action: "update", rkey, value: record.value }
  })

  const deletions = remote
    .filter(record => sites.has(record.value?.site) && !localKeys.has(rkeyOf(record.uri)))
    .map(record => ({ action: "delete", rkey: rkeyOf(record.uri) }))

  return [...compared, ...deletions]
}

/** @param {{ action: string, rkey: string, value?: unknown, collection?: string }} write */
function applyWrite({ action, rkey, value, collection = DOCUMENT }) {
  const base = { $type: `com.atproto.repo.applyWrites#${action}`, collection, rkey }
  return action === "delete" ? base : { ...base, value }
}

/**
 * @param {{ dryRun?: boolean, optional?: boolean } | undefined} payload
 * @param {{ config: import("votive").VotiveConfig, notify: (message: object) => void }} context
 */
async function publishToAtproto(payload, { config, notify }) {
  const dryRun = Boolean(payload?.dryRun)

  notify({ status: "progress", message: "Building..." })
  const { did, pds: configuredPDS, domain, records, publication } = await collectRecords(config)

  if ((typeof did !== "string" || !did) && payload?.optional) {
    notify({ status: "done", message: "No atproto_did in settings.md; nothing to publish to AT Protocol" })
    return { skipped: true }
  }
  if (typeof did !== "string" || !did) throw new Error("atproto: set atproto_did in the root settings.md")
  const origin = siteOrigin(domain)
  if (!origin) throw new Error("atproto: set domain in the root settings.md; every record carries the site's url")

  const accounts = new Set(records.map(record => record.uri.split("/")[2]))
  const others = [...accounts].filter(account => account !== did)
  if (others.length) throw new Error(`atproto: pages name ${others.join(", ")}; one site publishes to one account (${did})`)

  if (typeof publication.name !== "string" || !publication.name) {
    throw new Error("atproto: set name in the root settings.md; the publication needs one")
  }

  const icon = publication.icon ? await iconBlob(publication.icon, publication.iconPath) : undefined
  const publicationRecord = {
    $type: PUBLICATION,
    url: origin,
    name: publication.name,
    ...(typeof publication.description === "string" && publication.description ? { description: publication.description } : {}),
    ...(icon ? { icon: icon.ref } : {})
  }
  const publicationURL = publicationURI(did, origin)

  // A document is this site's when its `site` is the publication, or the
  // origin a loose document carried before there was one.
  const sites = new Set([origin, publicationURL, ...records.map(record => record.value.site)])
  const pds = typeof configuredPDS === "string" && configuredPDS ? configuredPDS : await resolvePDS(did)

  notify({ status: "progress", message: `Comparing ${records.length} records with ${pds}...` })
  const remote = await listAll(pds, did, DOCUMENT)
  const remotePublications = await listAll(pds, did, PUBLICATION)
  const publicationWrite = planPublication(remotePublications, rkeyOf(publicationURL), publicationRecord)
  const plan = planWrites(records, remote, sites)

  const count = (action) => plan.filter(write => write.action === action).length
  const summary = {
    created: count("create"),
    updated: count("update"),
    deleted: count("delete"),
    unchanged: count("unchanged"),
    collisions: plan.filter(write => write.action === "collision").map(({ rkey, site }) => ({ rkey, site })),
    publication: publicationWrite.action,
    dryRun
  }
  // A command's config comes straight from the caller and may carry no
  // logger; votive() adds one only to the config its hooks receive.
  const log = config.log ?? ((level, message) => console.error(message))
  for (const { rkey, site } of summary.collisions) {
    log("error", `atproto: ${DOCUMENT}/${rkey} belongs to ${site}, not ${origin}; left alone`)
  }

  const publicationWrites = publicationWrite.action === "unchanged" ? [] : [{ ...publicationWrite, collection: PUBLICATION }]
  const documentWrites = plan.filter(write => ["create", "update", "delete"].includes(write.action))
  const writes = [...publicationWrites, ...documentWrites].map(applyWrite)
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

export { publishToAtproto, planWrites, planPublication, sameRecord, resolvePDS, blobCID, xrpc, passwordFile }
