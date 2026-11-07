/**
 * A link to another site opens in a new tab (per Sam, Nov 7) and says
 * it leaves: `rel=external`, the HTML link type for exactly that, and
 * the CSS hook (`a[rel~=external]`). `noopener noreferrer` as link
 * previews already had: the new page can't reach this one through
 * `window.opener`, and isn't told where the visitor came from.
 *
 * Another site is an http(s) url whose host isn't the site's own
 * `domain`, `www.` or not. A path, an anchor, `mailto:` and the like are
 * not links to another site.
 */

const EXTERNAL_REL = ["external", "noopener", "noreferrer"]

/** @param {string} host */
const bareHost = (host) => host.toLowerCase().replace(/^www\./, "")

/**
 * @param {unknown} href
 * @param {unknown} domain - the site's `domain` setting, if any
 */
export function isExternalURL(href, domain) {
  if (typeof href !== "string" || !/^(https?:)?\/\//i.test(href)) return false
  const url = URL.parse(href, "https://placeholder.invalid")
  if (!url) return false
  if (typeof domain !== "string" || !domain) return true
  const own = URL.parse(/^[a-z]+:\/\//i.test(domain) ? domain : `https://${domain}`)
  return !own || bareHost(url.hostname) !== bareHost(own.hostname)
}

/**
 * An `<a>`'s properties with the new tab and the rel tokens added, any
 * rel it had kept first (`me`, on a social link).
 * @param {Record<string, any>} properties
 */
export function externalProperties(properties) {
  const had = [properties.rel ?? []].flat().flatMap(value => String(value).split(/\s+/)).filter(Boolean)
  const rel = [...new Set([...had, ...EXTERNAL_REL])]
  return { ...properties, target: "_blank", rel }
}
