import { styleText } from "node:util"
import { isSecretPath } from "../../secretPaths.js"

/** @import * as Votive from "votive" */

/**
 * Where your secret pages are. A page under a `##` segment is published
 * at a hashed url that nothing on the site links to, so the author needs
 * another way to find it: the dev server prints each one, file and url,
 * when it first sees it - every one at startup, then each new one (or a
 * renamed one, whose url changed) as it appears.
 *
 * **Only the dev server.** `init()` turns this on with
 * `config.announceSecretPages`; `deploy`, `publish` and a plain build
 * never do. Those run in CI too, where logs are kept and can be public,
 * and a logged url is exactly what the hash exists to keep private.
 *
 * It is a stub enumerator that declares no stubs: the one hook that runs
 * on every pass and can list pages. It lists only the hidden ones - a
 * secret page is always hidden (markdown/index.js) - so a pass costs an
 * indexed query, not a listing of the site.
 */

/**
 * What has been printed, per site: the config votive hands every pass
 * is the same object for the life of a site, so a reopened project (the
 * desktop app) prints its pages again.
 * @type {WeakMap<object, Set<string>>}
 */
const announced = new WeakMap()

/**
 * @param {string | undefined} domain
 * @param {string} prettyURL
 */
function pageURL(domain, prettyURL) {
  if (typeof domain !== "string" || !domain) return prettyURL
  const base = domain.startsWith("http") ? domain : `https://${domain}`
  return new URL(prettyURL, base).href
}

/** @type {Votive.ProcessorStubs} */
function createStubs({ api, settings, config }) {
  if (!config.announceSecretPages || config.logging === "silent") return []

  const seen = announced.get(config) ?? new Set()
  announced.set(config, seen)

  const hidden = api.targets({ folder: "", recursive: true, query: { hidden: true } })
  const pages = hidden.filter(target => (
    target.extension === ".html"
    && target.write !== false
    && typeof target.source === "string"
    && isSecretPath(target.source)
  ))
  const domain = settings.lastNonNull("fm_domain")
  const fresh = pages
    .map(page => ({ source: page.source, url: pageURL(domain, page.metadata.prettyURL) }))
    .filter(({ source, url }) => !seen.has(`${source} ${url}`))
    .sort((a, b) => a.source < b.source ? -1 : a.source > b.source ? 1 : 0)

  for (const { source, url } of fresh) {
    seen.add(`${source} ${url}`)
    console.info(`${styleText("dim", "secret:")} ${styleText("yellow", source)} ${styleText("dim", "→")} ${styleText("cyan", url)}`)
  }
  return []
}

/** @type {Votive.VotivePlugin} */
const vowelSecretPagesPlugin = {
  name: "vowel-secret-pages",
  processors: [{ createStubs }]
}

export default vowelSecretPagesPlugin
