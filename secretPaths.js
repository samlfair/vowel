import { hash } from "node:crypto"
import path from "node:path"

/**
 * Secret paths.
 *
 * A `§` inside a file or folder name, with a word character on each side,
 * marks that segment secret. The text before it is the **name**; the text
 * after it is the **salt**. The whole segment is replaced by a hash, so
 * the page - or the whole folder - is published at an unguessable URL
 * and nowhere else.
 *
 *   blog/hidden§purple-bear/post.md   ->   blog/<hash>/post.html
 *   hello-world§red-whale.md          ->   <hash>.html
 *
 * **The hash input is frozen.** Changing any part of it rotates every
 * secret URL on every site, silently. It is:
 *
 *   the project-relative source path, forward slashes (whatever the
 *   platform's separator), no leading slash,
 *   up to and including the segment being hashed, salt in place, and the
 *   extension included for a file.
 *
 * So `blog/hidden§purple-bear/post.md` hashes its folder from
 * `"blog/hidden§purple-bear"`, and `reports/dev§blue-parrot.md` hashes
 * from `"reports/dev§blue-parrot.md"`. Each segment hashes against the
 * *original* path, not one already rewritten above it, so the value is
 * reproducible by hand. SHA-256, first 16 hex characters: 64 bits is far
 * beyond guessable for a share-link, and short enough to paste.
 *
 * **This is a routing rule, installed as votive's `config.router`**, not
 * a markdown feature. A secret folder holds images, fonts and stylesheets
 * as well as pages, each routed by a different processor - a rule
 * implemented per-processor leaks the folder name through whichever
 * processor forgets it. One cascade above them all cannot be forgotten.
 *
 * Only routing is rewritten. The source keeps its real path everywhere it
 * is stored, diffed or looked up. That means **the salt is in the
 * database**, and every place a source path can reach rendered output
 * has to go through `displayName()` first - the title, the breadcrumb,
 * anything derived from a filename. `tests/secretPaths.js` walks the
 * output folder and asserts no salt appears in it.
 *
 * `§` is legal on every platform and has no Unicode decomposition, so
 * macOS's filename normalisation cannot split it into two forms. A
 * legacy tool that re-encodes a filename as Latin-1 would change the
 * bytes and rotate the URL; vowel-desktop owns the folder, so this is
 * documented rather than defended against.
 *
 * The security model is the unguessable URL. The salt is only as secret
 * as the source tree.
 */

const MARKER = "§"

/** Lowercase by construction; votive lowercases stored target paths. */
function hashSegmentInput(input) {
  return hash("sha256", input).slice(0, 16)
}

/**
 * Splits a segment's stem into name and salt. `null` when it carries no
 * marker. Throws on a malformed one - an empty name or salt, or a second
 * marker - rather than guessing which part is which.
 * @param {string} stem - a segment without its extension
 * @param {string} sourcePath - for the error message
 * @returns {{ name: string, salt: string } | null}
 */
function parseSecret(stem, sourcePath) {
  const first = stem.indexOf(MARKER)
  if (first === -1) return null

  const name = stem.slice(0, first)
  const salt = stem.slice(first + 1)

  if (!name || !salt || !/\w$/.test(name) || !/^\w/.test(salt) || salt.includes(MARKER)) {
    throw new Error(
      `"${sourcePath}": a secret segment is "<name>${MARKER}<salt>" with a word character ` +
      `on each side of the ${MARKER}, and only one ${MARKER}. Got "${stem}".`
    )
  }

  return { name, salt }
}

/** A filename's stem and extension; a folder segment has no extension. */
function splitExtension(segment, isFile) {
  if (!isFile) return { stem: segment, ext: "" }
  const dot = segment.lastIndexOf(".")
  if (dot <= 0) return { stem: segment, ext: "" }
  return { stem: segment.slice(0, dot), ext: segment.slice(dot) }
}

/**
 * votive's `config.router`: source path in, source path out.
 * @param {string} sourcePath - relative to sourceFolder
 * @returns {string}
 */
function secretRouter(sourcePath) {
  if (!sourcePath.includes(MARKER)) return sourcePath

  // Stored paths use the platform separator; the hash *input* never does.
  // It is frozen as forward-slash-joined so the same file hashes the same
  // on every platform - otherwise a project moved to Windows would rotate
  // every secret url.
  const segments = sourcePath.split(path.sep)

  return segments.map((segment, index) => {
    const isFile = index === segments.length - 1
    const { stem, ext } = splitExtension(segment, isFile)
    if (!parseSecret(stem, sourcePath)) return segment

    // Hashed from the original path up to and including this segment.
    const input = segments.slice(0, index + 1).join("/")
    return hashSegmentInput(input) + ext
  }).join(path.sep)
}

/**
 * Does this source path have any secret segment? The read uses it to mark
 * the page hidden, which keeps it out of every listing.
 * @param {string} sourcePath
 */
function isSecretPath(sourcePath) {
  return sourcePath.includes(MARKER)
}

/**
 * A source path with every salt removed: what the name looks like to a
 * reader. `blog/hidden§purple-bear/post.md` -> `blog/hidden/post.md`.
 *
 * **The single guard between the salt and the rendered page.** Anything
 * that derives a title, a label or a breadcrumb from a source path goes
 * through here first.
 * @param {string} sourcePath
 */
function displayPath(sourcePath) {
  if (!sourcePath.includes(MARKER)) return sourcePath

  const segments = sourcePath.split(path.sep)
  return segments.map((segment, index) => {
    const isFile = index === segments.length - 1
    const { stem, ext } = splitExtension(segment, isFile)
    const secret = parseSecret(stem, sourcePath)
    return secret ? secret.name + ext : segment
  }).join(path.sep)
}

/**
 * Every salt in a source path, for the leak test.
 * @param {string} sourcePath
 * @returns {string[]}
 */
function saltsIn(sourcePath) {
  if (!sourcePath.includes(MARKER)) return []
  const segments = sourcePath.split(path.sep)
  return segments.flatMap((segment, index) => {
    const { stem } = splitExtension(segment, index === segments.length - 1)
    const secret = parseSecret(stem, sourcePath)
    return secret ? [secret.salt] : []
  })
}

export { MARKER, secretRouter, isSecretPath, displayPath, saltsIn, hashSegmentInput }
