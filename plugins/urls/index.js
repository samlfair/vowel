import { parseURLMetadata } from "votive/internals"

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
 * Walks a target's abstract for link-preview paragraphs and queues one
 * fetch job per URL found, so the write side (html/index.js) can render
 * a preview card once the data is cached. Deliberately does not fetch
 * anything itself - jobs are only ever run when the caller invokes
 * runFetches() (see votive's fetchURLs.js), and a URL already cached
 * (success or in a failure cooldown) is skipped automatically, so this
 * never re-fetches the same link on every build.
 * @type {Votive.ReadAbstract}
 */
function transformFile(abstract, database, config, targetFilePath) {
  const jobs = []

  function walk(node) {
    if (!node || typeof node !== "object") return
    if (isExternalLinkParagraph(node)) {
      jobs.push({
        data: node.children[0].value,
        runner: "text",
        destination: targetFilePath
      })
      return
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }

  walk(abstract)

  return { abstract, jobs }
}

/**
 * Parses a fetched page into the flat shape link-preview rendering
 * wants, preferring OpenGraph, then standard meta tags, then Twitter
 * Card, for each field independently.
 * @param {string} html
 * @returns {{ title: string, description: string, image: string | undefined }}
 */
function parseLinkPreview(html) {
  const meta = parseURLMetadata(html)
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
  read: {
    url: parseLinkPreview
  }
}

/** @type {Votive.VotivePlugin} */
const vowelURLsPlugin = {
  name: "vowel-urls",
  processors: [linkPreviewProcessor]
}

export default vowelURLsPlugin
export { isExternalLinkParagraph, parseLinkPreview }
