import { hash } from "node:crypto"

/**
 * Secret paths.
 *
 * A source path segment beginning with `-` is secret: the segment is
 * replaced by a hash of its own name, so the page (or the whole folder)
 * is published at an unguessable URL and nowhere else.
 *
 *   blog/-wayne-gretzky/hello.md  ->  blog/<md5>/hello.html
 *
 * **This is a routing rule, not a page's business**, which is why it is
 * installed as votive's `config.router` rather than in the markdown
 * processor. A secret folder holds images, fonts and stylesheets as well
 * as pages, and each of those is routed by a different processor - so a
 * rule implemented per-processor leaks the folder name through whichever
 * processor forgets it. One cascade above them all cannot be forgotten.
 *
 * It replaces the old `secret_key` frontmatter property, which hashed one
 * page at a time, could not cover a folder, and had to be kept from
 * rendering into its own page (see hiddenProperties).
 *
 * The hash is over the segment *without* the dash, so `-drafts` is the
 * same secret wherever it appears, and renaming the segment is a delete
 * plus an add - which now deletes the old target and its file, because a
 * source that stops existing takes its target with it.
 *
 * Lowercase by construction: votive canonicalizes stored target paths by
 * lowercasing them, so an uppercase digest would name a row that nothing
 * is stored under. An md5 hex digest is already lowercase; the slice is
 * explicit about it anyway.
 */

/** A path segment is secret when it begins with "-". */
function isSecretSegment(segment) {
  return segment.startsWith("-") && segment.length > 1
}

/** @param {string} segment - without its leading dash */
function hashSegment(segment) {
  return hash("MD5", segment).toLowerCase()
}

/**
 * votive's `config.router`: source path in, source path out. Only the
 * routing is rewritten - the source keeps its real path everywhere it is
 * stored, diffed or looked up, so `?source`, relative links and
 * `buffer()` all still find the file the author wrote.
 * @param {string} sourcePath - relative to sourceFolder
 * @returns {string}
 */
function secretRouter(sourcePath) {
  if (!sourcePath.includes("-")) return sourcePath

  const segments = sourcePath.split("/")
  const parsed = segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    if (!isLast) return isSecretSegment(segment) ? hashSegment(segment.slice(1)) : segment

    // The filename: hash the stem, keep the extension, so `-notes.md`
    // still routes through the markdown processor.
    const dot = segment.lastIndexOf(".")
    const stem = dot === -1 ? segment : segment.slice(0, dot)
    const ext = dot === -1 ? "" : segment.slice(dot)
    return isSecretSegment(stem) ? hashSegment(stem.slice(1)) + ext : segment
  })

  return parsed.join("/")
}

/**
 * Does this source path have any secret segment? The read uses it to mark
 * the page hidden, which is what keeps it out of every listing.
 * @param {string} sourcePath
 */
function isSecretPath(sourcePath) {
  return sourcePath.split("/").some((segment, index, all) => {
    if (index < all.length - 1) return isSecretSegment(segment)
    const dot = segment.lastIndexOf(".")
    return isSecretSegment(dot === -1 ? segment : segment.slice(0, dot))
  })
}

export { secretRouter, isSecretPath, isSecretSegment, hashSegment }
