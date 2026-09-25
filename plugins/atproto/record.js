import { toText } from "hast-util-to-text"
import { MARKER } from "../../secretPaths.js"
import createRkey from "./rkey.js"

/**
 * Which pages become records, and what each record holds. No network:
 * everything here is a function of the page and its settings, so it runs
 * in the build, and the publish command only compares and sends.
 */

const DOCUMENT = "site.standard.document"
const PUBLICATION = "site.standard.publication"

/** The lexicons vowel can build a record for. */
const SUPPORTED = [DOCUMENT]

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

/**
 * A `site.standard.document` record for the page, or the list of what it
 * is missing. `title`, `publishedAt` and `site` are required by the
 * lexicon; a page without a date cannot be a document. `site` is the
 * publication's AT-URI; `origin` is what the page's key is made from.
 * @param {{ metadata: Record<string, any> }} target
 * @param {string | undefined} origin
 * @param {string} [site] - the publication's AT-URI
 * @returns {{ record: Record<string, unknown> } | { missing: string[] }}
 */
function documentRecord(target, origin, site = origin) {
  const { title, date, prettyURL, description, tags, hastAbstract } = target.metadata
  const published = date ? new Date(date) : undefined
  const validDate = published && !Number.isNaN(published.getTime())

  const missing = [
    ...(origin ? [] : ["domain"]),
    ...(title ? [] : ["title"]),
    ...(validDate ? [] : ["date"])
  ]
  if (missing.length) return { missing }

  const textContent = hastAbstract ? toText(hastAbstract).trim() : ""

  const record = {
    $type: DOCUMENT,
    site,
    path: prettyURL,
    title,
    publishedAt: published.toISOString(),
    ...(description ? { description } : {}),
    ...(Array.isArray(tags) && tags.length ? { tags } : {}),
    ...(textContent ? { textContent } : {})
  }
  return { record }
}

/**
 * The page's AT-URI and record, or why it has none. `skip` is silent (the
 * page is not meant to be published). `incomplete` is a page under a
 * lexicon that lacks a property the lexicon requires; it is not a record,
 * by design, and is only mentioned under `verbose`. `warning` is a
 * misconfiguration: a lexicon vowel cannot build.
 * @param {{ path: string, source?: string, metadata: Record<string, any> }} target
 * @param {{ did: string, domain: unknown, settings: any }} context
 * @returns {{ atUri: string, record: Record<string, unknown> } | { skip: true } | { incomplete: string } | { warning: string }}
 */
function pageRecord(target, { did, domain, settings }) {
  const lexicon = lexiconFor(target, settings)
  if (!lexicon) return { skip: true }
  if (!SUPPORTED.includes(lexicon)) {
    return { warning: `lexicon "${lexicon}" is not one vowel can build a record for (supported: ${SUPPORTED.join(", ")})` }
  }

  const origin = siteOrigin(domain)
  const site = origin ? publicationURI(did, origin) : undefined
  const built = documentRecord(target, origin, site)
  if ("missing" in built) {
    return { incomplete: `not published to AT Protocol: a ${lexicon} record needs ${built.missing.join(", ")}` }
  }

  // The key is the page's canonical URL - origin and path - and frozen
  // (rkey.js), whatever `site` holds.
  const rkey = createRkey(new URL(String(built.record.path), origin).href)
  return { atUri: `at://${did}/${lexicon}/${rkey}`, record: built.record }
}

export { DOCUMENT, PUBLICATION, SUPPORTED, lexiconFor, siteOrigin, publicationURI, documentRecord, pageRecord }
