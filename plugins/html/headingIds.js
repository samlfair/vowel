/**
 * A heading's id is `heading_` and its slug: `## Kerning` is
 * `#heading_kerning` (per Sam, Nov 7). Unprefixed, a heading called
 * "Content", "Logo" or "Backlinks" took the id of one of the page's own
 * elements (`section#content`, `img#logo`, `#backlinks`). `_` because
 * what follows is the author's, as in `fm_date`.
 *
 * A link written in a page, `[x](#kerning)` or `./post.md#kerning`,
 * follows: its anchor is a heading's unless it names one of the ids a
 * page has besides its headings, which an author can't add to (raw
 * HTML isn't rendered): Vowel's own, and GFM's footnotes'.
 */

export const HEADING_ID_PREFIX = "heading_"

const PAGE_IDS = new Set(["content", "backlinks", "logo", "wordmark", "title", "copyright", "shoutout", "footnote-label", "vowel-source"])

/**
 * The anchor an author wrote, as the id it means.
 * @param {string} fragment - without the `#`
 */
export function headingAnchor(fragment) {
  if (!fragment || PAGE_IDS.has(fragment) || fragment.startsWith("user-content-") || fragment.startsWith(HEADING_ID_PREFIX)) return fragment
  return HEADING_ID_PREFIX + fragment
}

/**
 * A url's `#anchor`, if it has one, as `headingAnchor` reads it.
 * @param {string} suffix - `?query#anchor`, `#anchor`, or ""
 */
export function withHeadingAnchor(suffix) {
  const at = suffix.indexOf("#")
  if (at === -1) return suffix
  return suffix.slice(0, at + 1) + headingAnchor(suffix.slice(at + 1))
}
