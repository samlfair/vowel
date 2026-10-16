import { MARKER } from "../../secretPaths.js"
import createRkey from "./rkey.js"
import { validNSID } from "./lexicons.js"

/**
 * Which pages become records, and where each record lives. No network,
 * and no lexicon: a page's lexicon and AT-URI are a function of the page
 * and its settings (`pageRecordURI`), worked out wherever they're needed -
 * the html plugin's write, for standard.site's `<link>`, and
 * atproto-publish. The record itself is made at publish (publish.js),
 * once the lexicon has been fetched (lexicons.js) and the page fitted to
 * it (mapper.js).
 *
 * At write, not in a transform: a transform runs only when its page is
 * read, so adding `atproto_did` or a lexicon to a settings.md changed
 * nothing for pages already built - not even after a restart, since the
 * database persists (tasks/1-proposed/transform-reruns-on-stale.md).
 * Settings read at write are tracked, so a change re-renders the pages
 * it reaches.
 *
 * `site.standard.publication` is the one lexicon named here: standard.site
 * defines a document's `site` as its publication's AT-URI, and vowel
 * interprets that standard as written - the site is a publication when
 * any of its pages publish to `site.standard.*`.
 */

const PUBLICATION = "site.standard.publication"

/**
 * The page's lexicon and, for a secret page, whether it may use it.
 *
 * `atproto_lexicon:` cascades from settings.md, and a page's own
 * frontmatter can set it too. A page under a secret segment (`##`) is published only when
 * the lexicon was set *inside* its secret scope: in its own frontmatter,
 * or in a settings.md at or below the secret folder. A lexicon inherited
 * from above the secret would publish a hidden page to the network by
 * accident.
 *
 * The settings chain is the page-as-folder chain of the routed path
 * (`blog/post.html` reads `""`, `blog`, `blog/post`), so level `k` holds
 * the first `k` segments. Routing replaces a segment with its hash but
 * keeps the depth, so the secret segment at source index `s` is level
 * `s + 1`, and every level from there down is inside it.
 * @param {{ source?: string, metadata: Record<string, any> }} target
 * @param {{ raw: (label: string) => (unknown[] | null)[] | undefined }} settings
 * @returns {string | undefined}
 */
function lexiconFor(target, settings) {
  const own = target.metadata.fm_atproto_lexicon
  if (typeof own === "string" && own) return own

  const levels = settings.raw("fm_atproto_lexicon") ?? []
  const deepest = levels.findLastIndex(values => Array.isArray(values) && values.length > 0)
  if (deepest === -1) return undefined
  const lexicon = levels[deepest].at(-1)
  if (typeof lexicon !== "string" || !lexicon) return undefined

  const segments = (target.source ?? "").split(/[\\/]/)
  const secret = segments.findIndex(segment => segment.includes(MARKER))
  if (secret !== -1 && deepest < secret + 1) return undefined
  return lexicon
}

/**
 * The site's origin from `domain:`, the same base the html plugin builds
 * the canonical link from. No trailing slash, per the lexicon.
 * @param {unknown} domain
 */
function siteOrigin(domain) {
  if (typeof domain !== "string" || !domain) return undefined
  const base = domain.startsWith("http") ? domain : `https://${domain}`
  return new URL(base).origin
}

/**
 * The site's publication: one per account and origin, its key derived
 * from the origin the way a document's is from its URL, so its AT-URI is
 * known before it exists. A document's `site` names it, and
 * `/.well-known/site.standard.publication` serves it, which is how the
 * domain claims it. The record itself is built by the publish command
 * (publish.js), because its icon is an uploaded image.
 * @param {string} did
 * @param {string} origin
 */
function publicationURI(did, origin) {
  return `at://${did}/${PUBLICATION}/${createRkey(origin)}`
}

/** A DID is `did:<method>:<id>`; that is all this checks. @param {unknown} value */
function validDID(value) {
  return typeof value === "string" && /^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(value)
}

/**
 * The page's AT-URI, from the page and its settings - the page-as-folder
 * view a write gets (`blog/post.html` reads `""`, `blog`, `blog/post`).
 * None for a page with `status: hidden`, which is listed nowhere, nor for
 * one that isn't written (`html_file: false`) - except `status: deleted`,
 * which is kept unwritten precisely so publish can delete its record.
 * None without an account, a `domain` (the key is made from the page's
 * url) or a lexicon. A lexicon name that isn't an NSID comes back as a
 * warning; whether the page fits its lexicon is publish's question.
 * @param {{ source?: string, write?: boolean, metadata: Record<string, any> }} target
 * @param {any} settings
 * @returns {{ uri?: string, warning?: string }}
 */
function pageRecordURI(target, settings) {
  const status = target.metadata.fm_status
  if (status === "hidden") return {}
  if (target.write === false && status !== "deleted") return {}
  const did = settings.lastNonNull("fm_atproto_did")
  if (!validDID(did)) return {}
  const origin = siteOrigin(settings.lastNonNull("fm_domain"))
  if (!origin) return {}
  const lexicon = lexiconFor(target, settings)
  if (!lexicon) return {}
  if (!validNSID(lexicon)) return { warning: `atproto_lexicon "${lexicon}" is not a lexicon name (an NSID, like app.bsky.feed.post)` }
  return { uri: recordURI(did, lexicon, origin, target.metadata.prettyURL) }
}

/**
 * The page's AT-URI: the account, the lexicon, and a key derived from
 * the page's canonical URL - origin and path - and frozen (rkey.js).
 * @param {string} did
 * @param {string} lexicon
 * @param {string} origin
 * @param {string} prettyURL
 */
function recordURI(did, lexicon, origin, prettyURL) {
  return `at://${did}/${lexicon}/${createRkey(new URL(prettyURL, origin).href)}`
}

export { PUBLICATION, validDID, lexiconFor, siteOrigin, publicationURI, recordURI, pageRecordURI }
