import path from "node:path"

/** @import * as Votive from "votive" */

/**
 * AT Protocol, phase one: the site's domain becomes the account's handle.
 *
 * An AT Protocol account is a DID (`did:plc:…`), and a domain becomes its
 * handle when the domain proves it points at that DID - one of the two
 * proofs is serving the DID as plain text at `/.well-known/atproto-did`.
 * That is a file, so it is a stub: declared when settings.md says
 *
 *     atproto:
 *       did: did:plc:abc123
 *
 * and gone, file and all, when it stops saying so. Deploying the site is
 * then the verification. Nothing here talks to the network; the author
 * pastes the DID from their account settings. Resolving it from a handle
 * is a later phase, through readURL like any other fetch.
 *
 * The rest of the integration - a lexicon per folder, an AT-URI per page,
 * publishing records to the PDS - is tasks/2-in-progress/atproto-integration.md.
 */

const WELL_KNOWN = path.join(".well-known", "atproto-did")

/** A DID is `did:<method>:<id>`; that is all this checks. */
function validDID(value) {
  return typeof value === "string" && /^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(value)
}

/**
 * The atproto settings block, from the nearest settings.md that has one.
 * `atproto` is not a reserved property, so it arrives as `fm_atproto`.
 * @param {{ lastNonNull: (label: string) => unknown }} settings
 */
function atprotoSettings(settings) {
  const block = settings.lastNonNull("fm_atproto")
  return block && typeof block === "object" && !Array.isArray(block) ? block : {}
}

/** @type {Votive.ProcessorStubs} */
function createStubs({ settings }) {
  const { did } = atprotoSettings(settings)
  if (!did) return []
  if (!validDID(did)) {
    throw new Error(`settings.md: atproto.did must look like did:plc:… or did:web:…, not ${JSON.stringify(did)}`)
  }
  return [{ path: WELL_KNOWN, params: { did } }]
}

/** @type {Votive.ProcessorExpand} */
function expandStubs({ params }) {
  return { text: params.did }
}

/**
 * Claims files with **no extension**, which is what a well-known file
 * is. The scan never hands this processor a real file - dot-folders are
 * skipped - so only the stub arrives; an extension-less file elsewhere in
 * the project (a LICENSE) is read here and routed nowhere.
 * @type {Votive.VotiveProcessor}
 */
const wellKnownProcessor = {
  extensions: [""],
  format: "text",
  router: ({ dir, name, ext }) => dir.includes(".well-known") ? { dir, name, ext } : false,
  createStubs,
  expandStubs,
  readFile: (source) => ({ data: source.text, metadata: {} }),
  writeFile: (target) => ({ data: target.data })
}

/** @type {Votive.VotivePlugin} */
const vowelAtprotoPlugin = {
  name: "vowel-atproto",
  processors: [wellKnownProcessor]
}

export default vowelAtprotoPlugin
export { validDID, atprotoSettings }
