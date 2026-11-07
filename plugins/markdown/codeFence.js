/**
 * A fenced code block's info string: its language, then its meta, which
 * can carry a title (per Sam, Nov 6):
 *
 *     ```md "Hello World.md"
 *     ```js title="app.js"
 *
 * The title is `title="..."` when the meta has one, else the first
 * quoted string standing on its own, in double or single quotes. The
 * rest of the meta is the author's, as frontmatter keys vowel doesn't
 * read are. GitHub ignores the meta, so a titled block still renders
 * there, without its title. `title="..."` is Docusaurus', Astro's and
 * rehype-pretty-code's spelling; the bare string is Vowel's short form,
 * which rules out Expressive Code's meaning for one (mark this text).
 *
 * Free of node builtins: the editor may need it.
 */

const KEYED = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)')(?=\s|$)/
const BARE = /(?:^|\s)(?:"([^"]*)"|'([^']*)')(?=\s|$)/

/**
 * The fence as micromark split it, at the first whitespace, read again.
 * A quoted first word is not a language: in ```` ```"notes.txt" ````
 * micromark's language is `"notes.txt"`, and the block has none.
 * @param {string | null | undefined} lang - mdast's `code.lang`
 * @param {string | null | undefined} meta - mdast's `code.meta`
 * @returns {{ language: string | null, meta: string | null, title: string | undefined }}
 */
export function parseFence(lang, meta) {
  const quoted = /^["']/.test(lang ?? "")
  const language = lang && !quoted ? lang : null
  const rest = (quoted ? [lang, meta].filter(Boolean).join(" ") : meta) || null
  const match = rest ? KEYED.exec(rest) ?? BARE.exec(rest) : null
  const title = (match?.[1] ?? match?.[2])?.trim() || undefined
  return { language, meta: rest, title }
}

/**
 * A title written back into a fence, as mdast's `lang` and `meta`:
 * `title="..."` after a language, the spelling other tools read, and
 * the bare string without one, since a `title=` would be read as the
 * language. Split at the first space, as micromark splits it: a `lang`
 * with a space in it is written with the space escaped. A title with a
 * double quote in it is in single quotes.
 * @param {string | null} language
 * @param {string} title
 * @returns {{ lang: string | null, meta: string | null }}
 */
export function fenceWithTitle(language, title) {
  const quote = title.includes('"') ? "'" : '"'
  const quotedTitle = `${quote}${title}${quote}`
  if (language) return { lang: language, meta: `title=${quotedTitle}` }
  const [first, ...rest] = quotedTitle.split(/\s+/)
  return { lang: first, meta: rest.join(" ") || null }
}
