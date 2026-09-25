import { deployToCloudflarePages } from "../deploy-cloudflare/index.js"
import { publishToAtproto } from "../atproto/publish.js"

/**
 * `vowel --command publish`: the site to Cloudflare Pages, then its
 * records to AT Protocol, in that order - the pages and the well-known
 * files are live before any record points at them. A failed deploy stops
 * it there. A site with no `atproto_did` is deployed and nothing more.
 *
 * The payload is passed to both: `{"dryRun": true}` builds, reports what
 * each would do and sends nothing; `{"projectName": "…"}` overrides
 * `cloudflare_project`.
 *
 * @param {{ dryRun?: boolean, projectName?: string } | undefined} payload
 * @param {{ config: import("votive").VotiveConfig, notify: (message: object) => void }} context
 */
async function publish(payload, context) {
  const cloudflare = await deployToCloudflarePages(payload, context)
  const atproto = await publishToAtproto({ ...payload, optional: true }, context)
  return { cloudflare, atproto }
}

/**
 * In vowel's default plugin list (config.js), beside the two commands it
 * runs.
 * @type {import("votive").VotivePlugin}
 */
const vowelPublishPlugin = {
  name: "vowel-publish",
  commands: { publish }
}

export default vowelPublishPlugin
export { publish }
