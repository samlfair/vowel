import { h } from "hastscript"

/**
 * Social links, from the `social_links` setting:
 *
 *   social_links:
 *     - label: GitHub
 *       url: https://github.com/samlfair
 *       icon: /icons/github.svg
 *     - label: Bluesky
 *       url: https://bsky.app/profile/littlefair.ca
 *
 * `icon` is a URL path from the root (`/x.svg`; `x.svg` means the same);
 * `./x.svg` is the settings file's own folder. Resolved at read, in
 * plugins/markdown/frontmatter.js, like `logo` and `icon`.
 *
 * A leaf overrides: the nearest folder that declares the label supplies
 * the whole list, and nothing above it contributes. That is the one
 * resolution `settings.lastNonNull()` cannot give for an array-valued
 * label - it would hand back the last *link* at the deciding level -
 * so the deciding slot is found from the raw sequence.
 *
 * No built-in icons, by decision: an author who wants one drops the SVG
 * in the project and names it. With an icon the label is the image's
 * alt text; without one it is the link text. The anchor carries the
 * icon as `--icon-url` too, the same arrangement as `a#logo`, so a
 * monochrome SVG can be masked in `currentColor` by the stylesheet.
 * `rel="me"` is the identity-link convention (IndieAuth, Mastodon
 * verification) and costs nothing.
 */

const LABEL = "fm_social_links"

/**
 * The nearest folder's whole list, or [].
 * @param {any} settings - the folder-scoped view
 * @returns {Array<{label?: string, url?: string, icon?: string}>}
 */
function socialLinks(settings) {
  const slots = settings?.raw?.(LABEL) ?? []
  const decided = slots.findLast(slot => slot?.length)
  return (decided ?? []).filter(link => link && typeof link === "object" && link.url)
}

/**
 * A `<nav>` of the links, or null when there are none.
 * @param {any} settings
 */
function socialLinksNav(settings) {
  const links = socialLinks(settings)
  if (!links.length) return null

  return h("nav.social-links", { "aria-label": "Social links" },
    h("ul", links.map(({ label, url, icon }) => {
      const text = label ?? url
      // A URL path from the root, resolved at read (frontmatter.js).
      const iconURL = icon ? String(icon) : null
      return h("li", h("a", {
        href: url,
        rel: "me",
        style: iconURL && `--icon-url: url("${iconURL}")`
      }, iconURL ? h("img", { src: iconURL, alt: text }) : text))
    }))
  )
}

export { socialLinks, socialLinksNav }
