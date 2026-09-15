import { hostSlug } from "votive"
import { default as parseURLMetadata } from "./urlMetadata.js"

/** @import * as Votive from "votive" */

const EXTERNAL_LINK_RE = /^https?:\/\/\S+$/

/**
 * Matches a markdown paragraph whose only content is a bare URL - see
 * CLAUDE.md: "a URL that is the only child of a paragraph" -
 *   Dinosaurs lived 65,000,000 years ago.
 *
 *   https://dinosaurs.com/timeline
 *
 *   We still find their fossils today.
 * Same shape html/index.js's own `testPaths` already matches for
 * internal single-link paragraphs (one text-only child) - this is the
 * external-URL counterpart.
 * @param {any} node
 */
function isExternalLinkParagraph(node) {
  if (node.type !== "element") return false
  if (node.tagName !== "p") return false
  if (node.children.length !== 1) return false
  const [child] = node.children
  if (!child || typeof child.value !== "string") return false
  return EXTERNAL_LINK_RE.test(child.value)
}

/**
 * Walks a target's hast abstract for link-preview paragraphs and asks
 * for each URL found, so the write side (html/index.js) can render a
 * preview card once the data is cached. api.url() fetches nothing
 * itself: an unknown URL is queued for the build's deferred pass and
 * parsed by this processor's readURL (parseLinkPreview below), a cached
 * one comes straight back, and one in its failure cooldown is neither -
 * so this never re-fetches the same link on every build.
 * @type {Votive.ProcessorTransform}
 */
function transformFile(target, { api }) {
  function walk(node) {
    if (!node || typeof node !== "object") return
    if (isExternalLinkParagraph(node)) {
      api.url(node.children[0].value)
      return
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }

  // The parsed tree is a metadata convention; a plugin that can't find
  // it would parse target.data instead.
  walk(target.metadata.hastAbstract)
}

/**
 * A readable path for a fetched page's file in the url store:
 * `<host>/<last path segment or "index">`. The filename is not the
 * identity - the url inside the file is - so this only has to be
 * something a person can find. Votive appends a tiebreaker and `.yaml`.
 * @param {URL} url
 */
function previewPath(url) {
  const segments = url.pathname.split("/").filter(Boolean)
  const leaf = (segments.at(-1) || "index")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "index"
  return `${hostSlug(url)}/${leaf}`
}

/**
 * Parses a fetched page into the flat shape link-preview rendering
 * wants, preferring OpenGraph, then standard meta tags, then Twitter
 * Card, for each field independently, and says where to file it.
 * The body method is lazy, so a plugin that only wanted headers would
 * never read it; this one wants the HTML.
 * @type {Votive.ProcessorReadURL}
 */
async function parseLinkPreview(response) {
  const meta = parseURLMetadata(await response.text())
  return {
    path: previewPath(response.url),
    data: {
      title: meta.openGraph.title || meta.title || meta.twitterCard.title || "",
      description: meta.openGraph.description || meta.description || meta.twitterCard.description || "",
      image: meta.openGraph.image || meta.twitterCard.image || undefined
    }
  }
}

/**
 * Asks for the urls a page links. Its extension is the *page's* (.html)
 * - it is a transform on rendered pages.
 * @type {Votive.VotiveProcessor}
 */
const linkAsker = {
  extensions: [".html"],
  format: "text",
  transformFile
}

/**
 * Parses what was fetched. A `format: "url"` processor's extensions are
 * the *url's*: "" for a page with no extension, which is most of the web,
 * plus the ones that spell it out. Nothing else - an .mp3 or an .ical
 * link is not a page and gets no preview until a processor for it
 * exists. Exact matches only, by design; there is no wildcard.
 * @type {Votive.VotiveProcessor}
 */
const linkPreviewProcessor = {
  format: "url",
  extensions: ["", ".html", ".htm", ".php", ".asp", ".aspx"],
  readURL: parseLinkPreview
}

/** @type {Votive.VotivePlugin} */
const vowelURLsPlugin = {
  name: "vowel-urls",
  processors: [linkAsker, linkPreviewProcessor]
}

export default vowelURLsPlugin
export { isExternalLinkParagraph, parseLinkPreview, previewPath }
