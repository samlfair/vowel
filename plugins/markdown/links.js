import path from "node:path"

/**
 * The pages a page links to, explicitly. Recorded at read as
 * `metadata.links`, and read back at write by every page asking "who
 * links to me?" - that is what a backlink is, and it is a listing,
 * which votive already keeps correct (a filtered listing tracks the
 * labels it filters on, so a page gaining or losing a link restales the
 * pages whose backlinks that changes).
 *
 * **Explicit** is the rule, per Sam. What counts:
 *
 *   - a markdown link to a page: `[text](./post.md)` or `[text](/blog/post)`
 *   - a bare reference paragraph: a line that is just `/blog/post`
 *   - a frontmatter value that is a link: `related: ./post.md`
 *
 * What does not: a glob (`/blog/**` lists pages; it does not link to
 * them), an external url, a fragment, and anything a listing *renders*
 * - the author wrote none of those links, so none of them is a backlink.
 *
 * Two spellings, kept as two: a `./` link resolves to a **source path**
 * (`blog/post.md`), a `/` link is a **target url** (`/blog/post`). The
 * backlinks query matches either against the page's own source path or
 * its prettyURL, so a secret page linked as `./notes##salt.md` gets its
 * backlink by source path and nothing has to know the hash.
 */

/** @param {string} value */
function isGlob(value) {
  return /\*\s*$/.test(value)
}

/**
 * Normalizes one href to a link identifier, or null when it is not a
 * link to a page in this site.
 * @param {string} href - as written
 * @param {string} fromPath - the linking page's source path
 * @returns {string | null}
 */
function normalizeLink(href, fromPath) {
  if (typeof href !== "string" || !href) return null

  // Decoded: a link is an href, and toHast would percent-encode a marker
  // in it; the source is stored as the author spelled it.
  let decoded
  try { decoded = decodeURIComponent(href) } catch { return null }

  if (decoded.startsWith("./") || decoded.startsWith("../")) {
    // A source path may contain the secret marker ("##"), so "#" is not
    // where the path ends. The extension is: a fragment can only follow
    // it. `./notes##salt.md#top` -> `notes##salt.md`; a link with no
    // extension is taken whole.
    const match = decoded.match(/^(.*?\.[a-z0-9]+)(?:[#?].*)?$/i)
    const filePath = match ? match[1] : decoded
    return path.normalize(path.join(path.dirname(fromPath), filePath))
  }

  // A target url never carries the marker - it is hashed away - so the
  // first "#" or "?" ends it.
  const withoutFragment = decoded.split("#")[0].split("?")[0]
  if (!withoutFragment) return null

  if (withoutFragment.startsWith("/") && !withoutFragment.startsWith("//")) {
    if (isGlob(withoutFragment)) return null
    // A target url: the prettyURL form, no extension, no trailing slash.
    return withoutFragment.replace(/\.html$/, "").replace(/(.)\/$/, "$1")
  }

  return null
}

/**
 * The tree's links come from the read walk (readRules.js); this adds the
 * frontmatter's - any declared key whose value is a link - and keeps
 * the list distinct, in order of first appearance.
 * @param {string[]} fromTree - already normalized, from the walk
 * @param {object} metadata - after getMetadata, with frontmatter on it
 * @param {string} fromPath - the linking page's source path
 * @returns {string[]}
 */
function collectLinks(fromTree, metadata, fromPath) {
  const found = [...fromTree]
  const add = (href) => {
    const link = normalizeLink(href, fromPath)
    if (link && !found.includes(link)) found.push(link)
  }

  for (const key of metadata.frontmatter_keys || []) {
    const value = metadata[key] ?? metadata[`fm_${key}`]
    const values = Array.isArray(value) ? value : [value]
    values.forEach(v => typeof v === "string" && (v.startsWith("./") || v.startsWith("/")) && add(v))
  }

  return found
}

export { collectLinks, normalizeLink }
