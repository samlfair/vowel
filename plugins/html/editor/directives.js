// Shared encoding for directive parameters carried in class attributes.
//
// The generated HTML is the source of truth for the editor, so a directive
// that expanded into a subtree (a glob list, a reference card) has to be
// reconstructible from attributes that are visible and worth styling - not
// from the original markdown stamped into a data attribute.
//
// This module is imported by both plugins/html/index.js (node, emit side)
// and the browser bundle (ingest side), so it must stay free of node
// builtins.

// Folder segments are joined with "_", so "_" inside a segment is escaped
// to "--". A literal "--" in a folder name therefore collides with an
// escaped "_"; that is rarer than a single hyphen, and single hyphens pass
// through untouched, which keeps the common case ("my-blog" -> "_my-blog")
// clean and styleable. Emit warns on the collision rather than mangling it.
const SEGMENT_SEPARATOR = "_"
const ESCAPED_UNDERSCORE = "--"

/** @param {string} segment */
export function escapeSegment(segment) {
  return segment.replaceAll(SEGMENT_SEPARATOR, ESCAPED_UNDERSCORE)
}

/** @param {string} segment */
export function unescapeSegment(segment) {
  return segment.replaceAll(ESCAPED_UNDERSCORE, SEGMENT_SEPARATOR)
}

/** @param {string} segment */
export function segmentIsAmbiguous(segment) {
  return segment.includes(ESCAPED_UNDERSCORE)
}

/**
 * Cumulative ancestor classes for a folder, so a stylesheet can target any
 * level: "a/b/c" -> ["_", "_a", "_a_b", "_a_b_c"].
 * @param {string} folder
 */
export function dirClasses(folder) {
  const segments = folder.split(/[\\/]/).filter(Boolean).map(escapeSegment)
  const cumulative = segments.map((_, index) => {
    return SEGMENT_SEPARATOR + segments.slice(0, index + 1).join(SEGMENT_SEPARATOR)
  })
  return [SEGMENT_SEPARATOR, ...cumulative]
}

/** @param {string[]} classList */
export function folderFromClasses(classList) {
  const dirClassList = classList.filter(name => name.startsWith(SEGMENT_SEPARATOR))
  if (!dirClassList.length) return null

  const deepest = dirClassList.reduce((longest, name) => {
    return name.length > longest.length ? name : longest
  }, "")

  const segments = deepest.slice(1).split(SEGMENT_SEPARATOR).filter(Boolean)
  return segments.map(unescapeSegment).join("/")
}

// Values become part of a class token, so anything that would need CSS
// escaping is rejected rather than emitted. The caller decides whether to
// warn or drop the parameter.
/** @param {string} value */
export function valueIsSafe(value) {
  return /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(value)
}

/**
 * @param {{folder: string, recursive?: boolean, limit?: number|string, tag?: string}} params
 */
export function globClasses({ folder, recursive, limit, tag }) {
  const classes = dirClasses(folder)
  const recursiveClass = recursive ? ["recursive"] : []
  const limitClass = limit ? [`limit-${limit}`] : []
  const tagClass = tag && valueIsSafe(tag) ? [`tag-${tag}`] : []
  return [...classes, ...recursiveClass, ...limitClass, ...tagClass]
}

/**
 * Inverse of globClasses. "limit" is the class spelling of the directive's
 * ?count= parameter.
 * @param {string[]} classList
 */
export function globParams(classList) {
  const folder = folderFromClasses(classList)
  if (folder === null) return null

  const limitClass = classList.find(name => name.startsWith("limit-"))
  const tagClass = classList.find(name => name.startsWith("tag-"))

  return {
    folder,
    recursive: classList.includes("recursive"),
    limit: limitClass ? limitClass.slice("limit-".length) : null,
    tag: tagClass ? tagClass.slice("tag-".length) : null
  }
}

/**
 * Rebuilds the markdown directive a glob list expanded from.
 * @param {{folder: string, recursive: boolean, limit: string|null, tag: string|null}} params
 */
export function globDirective({ folder, recursive, limit, tag }) {
  const base = "/" + [folder, recursive ? "**" : "*"].filter(Boolean).join("/")
  const countParam = limit ? [`count=${limit}`] : []
  const tagParam = tag ? [`tag=${tag}`] : []
  const query = [...countParam, ...tagParam].join("&")
  return query ? `${base}?${query}` : base
}
