import { promises as dns } from "node:dns"

/**
 * Lexicons, fetched from the Atmosphere. Vowel contains none: it knows
 * no schema and has no code for any one lexicon. A lexicon is resolved
 * the way atproto resolves one, and interpreted by mapper.js.
 *
 * 1. The NSID's authority, reversed, names a DNS TXT record:
 *    `app.bsky.feed.post` → `_lexicon.feed.bsky.app`, holding `did=…`.
 * 2. The DID document names the account's PDS.
 * 3. The PDS holds the schema as a `com.atproto.lexicon.schema` record
 *    whose key is the NSID.
 *
 * A lexicon that doesn't resolve is not supported; there is no bundled
 * fallback. Schemas are cached in memory for the life of the process -
 * they are fetched only by atproto-publish, and a published lexicon may
 * only change in ways that keep old records valid.
 */

const TIMEOUT = 30_000
const SCHEMA_COLLECTION = "com.atproto.lexicon.schema"

/**
 * An NSID: a reversed domain authority, then a name. Checked before
 * anything is looked up, so a typo in `atproto_lexicon` is reported as
 * one rather than as a DNS failure.
 */
const NSID = /^[a-zA-Z](?:[a-zA-Z0-9-]{0,62})?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62})?)+\.[a-zA-Z][a-zA-Z0-9]{0,62}$/

/** @param {unknown} value */
function validNSID(value) {
  return typeof value === "string" && value.length <= 317 && NSID.test(value)
}

/**
 * The DNS name holding an NSID's authority: every segment but the last,
 * reversed, under `_lexicon`.
 * @param {string} nsid
 */
function authorityName(nsid) {
  const segments = nsid.split(".")
  return `_lexicon.${segments.slice(0, -1).reverse().join(".")}`
}

/**
 * The PDS that hosts `did`, from its DID document. `did:plc` is resolved
 * through the PLC directory, `did:web` through its own host.
 * @param {string} did
 * @param {{ plcDirectory?: string, fetch?: typeof fetch }} [options]
 */
async function resolvePDS(did, { plcDirectory = "https://plc.directory", fetch = globalThis.fetch } = {}) {
  const documentURL = did.startsWith("did:plc:")
    // A leading slash: a bare `did:plc:…` would parse as its own scheme.
    ? new URL(`/${did}`, plcDirectory)
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
 * A ref as `[nsid, def]`: `#x` is local to `from`, `a.b.c#x` names
 * another lexicon's def, and a bare NSID is its `main`.
 * @param {string} ref
 * @param {string} from - the NSID the ref appears in
 * @returns {[string, string]}
 */
function splitRef(ref, from) {
  if (ref.startsWith("#")) return [from, ref.slice(1)]
  const [nsid, name = "main"] = ref.split("#")
  return [nsid, name]
}

/**
 * The refs a schema node points at, as `[nsid, def]` pairs: a ref, a
 * union's members, and whatever an array's items or an object's
 * properties point at.
 * @param {any} node
 * @param {string} from
 * @returns {[string, string][]}
 */
function refsOf(node, from) {
  if (!node || typeof node !== "object") return []
  if (node.type === "ref") return [splitRef(node.ref, from)]
  if (node.type === "union") return (node.refs ?? []).map(ref => splitRef(ref, from))
  if (node.type === "array") return refsOf(node.items, from)
  if (node.type === "record") return refsOf(node.record, from)
  if (node.type === "object") return Object.values(node.properties ?? {}).flatMap(property => refsOf(property, from))
  return []
}

/**
 * @typedef {{ lexicon: number, id: string, defs: Record<string, any> }} LexiconDoc
 * @typedef {{ lexicons: Map<string, LexiconDoc | null>, errors: Map<string, string> }} Loaded
 */

/**
 * A resolver with its own cache. `resolveTxt`, `plcDirectory` and
 * `fetch` are the three ways out to the network, so a test can stand in
 * for all of them.
 * @param {{ resolveTxt?: (name: string) => Promise<string[][]>, plcDirectory?: string, fetch?: typeof fetch }} [options]
 */
function createLexiconResolver({ resolveTxt = dns.resolveTxt, plcDirectory, fetch = globalThis.fetch } = {}) {
  /** @type {Map<string, Promise<{ doc: LexiconDoc | null, error?: string }>>} */
  const cache = new Map()

  /** @param {string} nsid */
  async function fetchLexicon(nsid) {
    if (!validNSID(nsid)) return { doc: null, error: `"${nsid}" is not a lexicon name (an NSID, like app.bsky.feed.post)` }
    const name = authorityName(nsid)
    const records = await resolveTxt(name).catch(() => [])
    const did = records.map(chunks => chunks.join("")).find(text => text.startsWith("did="))?.slice("did=".length)
    if (!did) return { doc: null, error: `${nsid} is not published (no DNS record at ${name})` }

    const pds = await resolvePDS(did, { plcDirectory, fetch })
    const url = new URL("/xrpc/com.atproto.repo.getRecord", pds)
    url.search = new URLSearchParams({ repo: did, collection: SCHEMA_COLLECTION, rkey: nsid }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
    if (!response.ok) return { doc: null, error: `${nsid} is not published (${did} has no schema for it: ${response.status})` }
    const doc = (await response.json()).value
    if (doc?.id !== nsid || !doc.defs) return { doc: null, error: `${nsid}: the schema ${did} publishes is not a lexicon for it` }
    return { doc }
  }

  /**
   * One lexicon, fetched once per process. A failure is cached too, as
   * an error string; a thrown network error is caught into one.
   * @param {string} nsid
   */
  function lexicon(nsid) {
    if (!cache.has(nsid)) {
      cache.set(nsid, fetchLexicon(nsid).catch(error => ({ doc: null, error: `${nsid}: ${error.message}` })))
    }
    return cache.get(nsid)
  }

  /**
   * A lexicon and every lexicon its record can reach through refs and
   * unions, fetched a level at a time. An unreachable one is `null`,
   * with its error; the mapper then can't check what it would have
   * described.
   * @param {string[]} roots - NSIDs whose `main` def to start from
   * @returns {Promise<Loaded>}
   */
  async function load(roots) {
    const lexicons = new Map()
    const errors = new Map()
    const visited = new Set()

    /** @param {[string, string][]} pending */
    async function crawl(pending) {
      const fresh = pending.filter(([nsid, name]) => !visited.has(`${nsid}#${name}`))
      if (!fresh.length) return
      fresh.forEach(([nsid, name]) => visited.add(`${nsid}#${name}`))
      const nsids = [...new Set(fresh.map(([nsid]) => nsid))].filter(nsid => !lexicons.has(nsid))
      const results = await Promise.all(nsids.map(nsid => lexicon(nsid)))
      nsids.forEach((nsid, index) => {
        lexicons.set(nsid, results[index].doc)
        if (results[index].error) errors.set(nsid, results[index].error)
      })
      const next = fresh.flatMap(([nsid, name]) => refsOf(lexicons.get(nsid)?.defs?.[name], nsid))
      await crawl(next)
    }

    await crawl(roots.map(nsid => [nsid, "main"]))
    return { lexicons, errors }
  }

  return { lexicon, load }
}

export { createLexiconResolver, resolvePDS, splitRef, validNSID, authorityName }
