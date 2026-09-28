import path from "node:path"
import { lexiconFor, publicationURI, recordURI, siteOrigin } from "./record.js"
import { validNSID } from "./lexicons.js"
import { publishToAtproto } from "./publish.js"
import { saveAppPassword } from "./password.js"

/** @import * as Votive from "votive" */

/**
 * AT Protocol, phase one: the site's domain becomes the account's handle.
 *
 * An AT Protocol account is a DID (`did:plc:…`), and a domain becomes its
 * handle when the domain proves it points at that DID - one of the two
 * proofs is serving the DID as plain text at `/.well-known/atproto-did`.
 * That is a file, so it is a stub: declared when settings.md says
 *
 *     atproto_did: did:plc:abc123
 *
 * and gone, file and all, when it stops saying so. Deploying the site is
 * then the verification. Nothing here talks to the network; the author
 * pastes the DID from their account settings. Resolving it from a handle
 * is a later phase, through readURL like any other fetch.
 *
 * Phase two: a page under an `atproto_lexicon:` gets an AT-URI, computed
 * by `transformFile` with no network (record.js). Any published lexicon
 * will do: vowel bundles none. Publishing is a command,
 * `atproto-publish` (publish.js), which fetches each lexicon, fits the
 * page to it (mapper.js) and sends what changed. A
 * `site.standard.document` page also gets a
 * `<link rel="site.standard.document">` from the html plugin.
 *
 * The publication: with a `domain` too, the site is a
 * `site.standard.publication`, every document's `site` names it, and
 * `/.well-known/site.standard.publication` serves its AT-URI - the
 * domain's claim to it. The record is the publish command's.
 */

const WELL_KNOWN = path.join(".well-known", "atproto-did")
const WELL_KNOWN_PUBLICATION = path.join(".well-known", "site.standard.publication")

/** A DID is `did:<method>:<id>`; that is all this checks. */
function validDID(value) {
  return typeof value === "string" && /^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(value)
}

/**
 * The account, from the nearest settings.md that names one. The atproto
 * settings are flat, `atproto_did` / `atproto_lexicon` / `atproto_pds`,
 * so each cascades on its own: a folder that sets only a lexicon keeps
 * the root's account. Not reserved, so each arrives as `fm_atproto_*`.
 * @param {{ lastNonNull: (label: string) => unknown }} settings
 */
function atprotoDID(settings) {
  return settings.lastNonNull("fm_atproto_did")
}

/**
 * The page's AT-URI, stored as metadata for the html plugin's link and
 * the publish command. Runs once per read of the page and reaches no
 * network, so it can't know whether the page fits its lexicon - the
 * publish command finds that out. A lexicon name that isn't an NSID is
 * warned about here.
 *
 * Not for a page with `status: hidden`, which is listed nowhere, nor for
 * one that isn't written (`html_file: false`) - except `status: deleted`,
 * which is kept unwritten precisely so publish can delete its record.
 */
function transformFile(target, { settings, config }) {
  const status = target.metadata.fm_status
  if (status === "hidden") return undefined
  if (target.write === false && status !== "deleted") return undefined
  const did = atprotoDID(settings)
  if (!validDID(did)) return undefined
  const origin = siteOrigin(settings.lastNonNull("fm_domain"))
  if (!origin) return undefined

  const lexicon = lexiconFor(target, settings)
  if (!lexicon) return undefined
  if (!validNSID(lexicon)) {
    config.log("warn", `${target.path}: atproto_lexicon "${lexicon}" is not a lexicon name (an NSID, like app.bsky.feed.post)`)
    return undefined
  }
  return { metadata: { atUri: recordURI(did, lexicon, origin, target.metadata.prettyURL) } }
}

/** @type {Votive.ProcessorStubs} */
function createStubs({ settings }) {
  const did = atprotoDID(settings)
  if (!did) return []
  if (!validDID(did)) {
    throw new Error(`settings.md: atproto_did must look like did:plc:… or did:web:…, not ${JSON.stringify(did)}`)
  }
  const origin = siteOrigin(settings.lastNonNull("fm_domain"))
  const publication = origin ? [{ path: WELL_KNOWN_PUBLICATION, params: { text: publicationURI(did, origin) } }] : []
  return [{ path: WELL_KNOWN, params: { text: did } }, ...publication]
}

/** @type {Votive.ProcessorExpand} */
function expandStubs({ params }) {
  return { text: params.text }
}

/**
 * Claims files with **no extension**, which is what a well-known file
 * is, and `.publication`, which `site.standard.publication` looks like
 * one to. The scan never hands this processor a real file - dot-folders
 * are skipped - so only the stubs arrive; a file elsewhere in the project
 * with either (a LICENSE) is read here and routed nowhere.
 * @type {Votive.VotiveProcessor}
 */
const wellKnownProcessor = {
  extensions: ["", ".publication"],
  format: "text",
  router: ({ dir, name, ext }) => dir.includes(".well-known") ? { dir, name, ext } : false,
  createStubs,
  expandStubs,
  readFile: (source) => ({ data: source.text, metadata: {} }),
  writeFile: (target) => ({ data: target.data })
}

const recordProcessor = {
  extensions: [".html"],
  format: "text",
  transformFile
}

/** @type {Votive.VotivePlugin} */
const vowelAtprotoPlugin = {
  name: "vowel-atproto",
  processors: [wellKnownProcessor, recordProcessor],
  commands: {
    "atproto-publish": publishToAtproto,
    "atproto-password": saveAppPassword
  }
}

export default vowelAtprotoPlugin
export { validDID, atprotoDID }
