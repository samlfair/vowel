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
 * Parses a fetched page into the flat shape link-preview rendering
 * wants, preferring OpenGraph, then standard meta tags, then Twitter
 * Card, for each field independently.
 * The body method is lazy, so a plugin that only wanted headers would
 * never read it; this one wants the HTML.
 * @type {Votive.ProcessorReadURL}
 */
async function parseLinkPreview(response) {
  const meta = parseURLMetadata(await response.text())
  return {
    title: meta.openGraph.title || meta.title || meta.twitterCard.title || "",
    description: meta.openGraph.description || meta.description || meta.twitterCard.description || "",
    image: meta.openGraph.image || meta.twitterCard.image || undefined
  }
}

/** @type {Votive.VotiveProcessor} */
const linkPreviewProcessor = {
  extensions: [".html"],
  format: "text",
  transformFile,
  readURL: parseLinkPreview
}

/** @type {Votive.VotivePlugin} */
const vowelURLsPlugin = {
  name: "vowel-urls",
  processors: [linkPreviewProcessor]
}

export default vowelURLsPlugin
export { isExternalLinkParagraph, parseLinkPreview }
