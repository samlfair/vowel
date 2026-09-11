import { fromHtml } from "hast-util-from-html"
import { toHtml } from "hast-util-to-html"
import { visit } from "unist-util-visit"

/**
 * Attributes holding a single URL. `srcset` is handled separately: it is
 * a comma-separated list of candidates, each a URL plus an optional
 * descriptor.
 */
const URL_PROPERTIES = ["src", "href", "poster"]

/**
 * @param {string} value
 * @param {string} domain
 * @returns {string}
 */
function absolute(value, domain) {
  // Only root-relative paths need rewriting. A bare "#anchor" is left
  // alone deliberately: in a reader it should still point within the
  // entry, not back to the site.
  if (!value.startsWith("/")) return value
  return new URL(value, domain).href
}

/**
 * @param {string} value - a srcset attribute
 * @param {string} domain
 * @returns {string}
 */
function absoluteSrcset(value, domain) {
  return value
    .split(",")
    .map(candidate => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/)
      return [absolute(url, domain), ...descriptor].join(" ")
    })
    .join(", ")
}

/**
 * @param {import("hast").Node} node
 */
function isContentSection(node) {
  if (node.type !== "element") return false
  const id = node.properties?.id
  return id === "content" || (Array.isArray(id) && id.includes("content"))
}

/**
 * Pulls the post body out of a rendered page, with every URL made
 * absolute.
 *
 * A feed entry's content is the *post*, not the page. `<main>` was the
 * other candidate and is wrong: it also holds the breadcrumb nav, the
 * table of contents and the rendered frontmatter lists, which are site
 * furniture and read badly in a reader. `<section id=content>` is exactly
 * the body.
 *
 * Taken from the rendered HTML rather than from `metadata.hastAbstract`,
 * which is the tree as the markdown plugin produced it - before the html
 * plugin resolves image paths, expands `/blog/**` directives and builds
 * link-preview cards. A feed built from that would carry unresolved
 * relative paths and literal directives.
 *
 * URLs are made absolute because a feed is read away from the site: a
 * reader resolves `/necklace.jpg` against its own host, not yours.
 *
 * @param {string | null | undefined} html - the page's rendered output
 * @param {string} domain - absolute, e.g. "https://example.com"
 * @returns {string} the body as HTML, or "" when there is no content
 */
export function entryContent(html, domain) {
  if (!html) return ""

  const tree = fromHtml(html, { fragment: false })

  /** @type {import("hast").Element | undefined} */
  let content
  visit(tree, isContentSection, (node) => {
    content = node
    return false
  })

  if (!content) return ""

  visit(content, "element", (node) => {
    for (const property of URL_PROPERTIES) {
      const value = node.properties?.[property]
      if (typeof value === "string") node.properties[property] = absolute(value, domain)
    }
    const srcset = node.properties?.srcSet ?? node.properties?.srcset
    if (typeof srcset === "string") {
      const key = node.properties.srcSet !== undefined ? "srcSet" : "srcset"
      node.properties[key] = absoluteSrcset(srcset, domain)
    }
  })

  // The children, not the <section> itself - the wrapper is vowel's page
  // structure, not part of the post.
  return toHtml({ type: "root", children: content.children })
}

export default entryContent
