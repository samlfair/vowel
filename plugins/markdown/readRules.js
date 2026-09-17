import { createVisitor } from "./visitor.js"
import { normalizeLink } from "./links.js"

/**
 * The read walk: one pass over the mdast that records what the page
 * says about itself and marks it up in place. Reading, per Sam's
 * convention - metadata extraction and the AST mutation that goes with
 * it happen together, in readFile, once.
 *
 * Context: `{ filePath, tags: string[], links: string[] }`. The caller
 * copies `tags` and `links` onto metadata afterwards.
 */

/** `#tag`, preceded by the start of the text or whitespace. */
const HASHTAG = /(^|\s)#([\w\-\/]+)\b/

/**
 * `#tag` becomes a link to the tag page and is recorded. Runs on every
 * text node outside code and links, so a tag in the middle of a
 * sentence counts (the old paragraph-is-one-text-node rule did not).
 * The class is what lets the editor's serializer write `#tag` back
 * rather than a generic link.
 * @type {import("./visitor.js").InlineRule}
 */
const hashtag = {
  name: "hashtag",
  pattern: HASHTAG,
  resolve: (match, context) => {
    const [, before, tag] = match
    if (!context.tags.includes(tag)) context.tags.push(tag)
    const link = {
      type: "link",
      url: `/tags/${tag}`,
      data: { hProperties: { className: ["hashtag"] } },
      children: [{ type: "text", value: `#${tag}` }]
    }
    return before ? [{ type: "text", value: before }, link] : link
  }
}

/**
 * An explicit link to a page in this site is recorded for backlinks;
 * the node itself is left alone. See links.js for what counts.
 * @type {import("./visitor.js").BlockRule}
 */
const link = {
  name: "link",
  test: (node) => node.type === "link",
  transform: (node, index, parent, context) => {
    record(context, node.url)
  }
}

/**
 * A bare reference paragraph - a line that is just `/blog/post` - is a
 * link too. The html write renders it as a reference card.
 * @type {import("./visitor.js").BlockRule}
 */
const reference = {
  name: "reference",
  test: (node) => node.type === "paragraph"
    && node.children?.length === 1
    && node.children[0].type === "text"
    && /^\/\S*$/.test(node.children[0].value.trim()),
  transform: (node, index, parent, context) => {
    record(context, node.children[0].value.trim())
  }
}

/**
 * @param {{ filePath: string, links: string[] }} context
 * @param {string} href
 */
function record(context, href) {
  const normalized = normalizeLink(href, context.filePath)
  if (normalized && !context.links.includes(normalized)) context.links.push(normalized)
}

/** No tags inside code, and no link inside a link. */
const skipped = new Set(["code", "inlineCode", "yaml", "html", "link", "linkReference", "definition"])

const readWalk = createVisitor({
  inline: [hashtag],
  block: [link, reference],
  skip: (node) => skipped.has(node.type)
})

export { readWalk, HASHTAG }
