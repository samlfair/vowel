import emojilib from "emojilib/dist/emoji-en-US.json" with { type: "json" }

/**
 * Shortcode -> emoji, from emojilib. Each emoji's first keyword is its
 * name (`grinning_face`, `party_popper`), and those win; the rest of its
 * keywords (`smile`, `tada`, `+1`) are fallbacks, first emoji listed
 * wins, so the GitHub-style short names still land somewhere sensible.
 * Built once at load. Free of node builtins.
 * @type {Map<string, string>}
 */
const byName = new Map()
const byKeyword = new Map()

for (const [emoji, keywords] of Object.entries(emojilib)) {
  const [name, ...rest] = keywords
  if (!byName.has(name)) byName.set(name, emoji)
  for (const keyword of rest) {
    if (!byKeyword.has(keyword)) byKeyword.set(keyword, emoji)
  }
}

/**
 * @param {string} shortcode - without the colons
 * @returns {string | undefined}
 */
function emojiFor(shortcode) {
  return byName.get(shortcode) ?? byKeyword.get(shortcode)
}

export { emojiFor }
