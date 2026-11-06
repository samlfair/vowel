/**
 * Prism's markdown grammar, made to read what Vowel reads: GitHub
 * Flavored Markdown, then Vowel's own syntax on top (per Sam, Nov 6:
 * Vowel is a GFM superset, so its code blocks highlight as GFM).
 *
 * Prism's grammar is close. These change what it gets wrong, measured
 * against micromark, which Vowel parses pages with:
 *
 * - frontmatter only on the first line (Prism allowed blank lines
 *   before it);
 * - fences of `~~~` as well as ```, and longer fences (a `~~~` fence was
 *   strikethrough, and a ```` fence ended at the first ``` inside it);
 * - table delimiter cells of one dash (Prism wanted three);
 * - task list items, footnotes and autolinks, which it didn't know.
 *
 * And these add Vowel's syntax, with the patterns `readRules.js` reads
 * it with: alerts, wikilinks, hashtags, `:shortcodes:`, `==highlights==`
 * and listing lines (`/blog/*`).
 *
 * Prism grammars are objects that are changed in place: `insertBefore`
 * is how a rule is added, and the order of rules is the order they are
 * tried in. A token that is cut out of a line hides it from the rules
 * after it: that is why a task item takes its list marker with it.
 */

/**
 * Prism's table patterns with one dash or more per delimiter cell.
 * @param {RegExp} pattern
 */
const oneDash = (pattern) => new RegExp(pattern.source.replaceAll("-{3,}", "-+"), pattern.flags)

/**
 * Extends the markdown grammar of this refractor, once.
 * @param {import("refractor/core").Refractor} refractor - with markdown registered
 */
export function extendMarkdown(refractor) {
  const languages = refractor.languages
  const markdown = languages.markdown

  markdown["front-matter-block"].pattern = /^---(?!.)[\s\S]*?[\r\n]---(?!.)/
  markdown["front-matter-block"].lookbehind = false

  // Three or more backticks or tildes, closed by the same character at
  // least as many times. The parts stay in the order Prism's
  // after-tokenize hook expects (fence, language, newline, block,
  // newline, fence): it reads the language from them, and highlights
  // the block in it.
  markdown.code[1] = {
    pattern: /^(([`~])\2{2,})[^\r\n]*(?:\r\n?|\n)(?:[\s\S]*?(?:\r\n?|\n))??\1\2*[ \t]*$/m,
    greedy: true,
    inside: {
      "code-block": {
        pattern: /^((?:`{3,}|~{3,})[^\r\n]*(?:\r\n?|\n))[\s\S]+(?=(?:\r\n?|\n)(?:`{3,}|~{3,})[ \t]*$)/,
        lookbehind: true
      },
      "code-language": {
        pattern: /^(`{3,}|~{3,})[^\s`~][^\r\n]*/,
        lookbehind: true
      },
      punctuation: /`{3,}|~{3,}/
    }
  }

  const table = markdown.table
  const rows = table.inside["table-data-rows"]
  const line = table.inside["table-line"]
  table.pattern = oneDash(table.pattern)
  rows.pattern = oneDash(rows.pattern)
  line.pattern = oneDash(line.pattern)
  line.inside.punctuation = oneDash(line.inside.punctuation)

  languages.insertBefore("markdown", "blockquote", {
    // `> [!NOTE]`, any word, at the start of a quote.
    alert: {
      pattern: /(^>[ \t]*)\[![A-Za-z]+\]/m,
      lookbehind: true,
      alias: "important"
    }
  })

  languages.insertBefore("markdown", "list", {
    // `- [x]` and `1. [ ]`.
    task: {
      pattern: /^[ \t]*(?:[*+-]|\d+[.)])[ \t]+\[[ xX]\](?=[ \t])/m,
      inside: {
        list: { pattern: /^[ \t]*(?:[*+-]|\d+[.)])/, alias: "punctuation" },
        checkbox: { pattern: /\[[ xX]\]/, alias: "keyword" }
      }
    },
    // A paragraph that is only a path: a listing (`/blog/*`, `./drafts/**`)
    // or a reference to a page (`/blog/post`).
    directive: {
      pattern: /(^|\n[ \t]*\n)(?:\/|\.\.?\/)\S*(?=[ \t]*(?:\n[ \t]*\n|\n?$))/,
      lookbehind: true,
      alias: "function"
    }
  })

  languages.insertBefore("markdown", "url-reference", {
    // `[^1]: The source.`, which Prism read as a link definition with
    // the first word as its url.
    "footnote-definition": {
      pattern: /^[ \t]*\[\^[^\]\s]+\]:/m,
      alias: "url"
    }
  })

  languages.insertBefore("markdown", "url", {
    // `[[Name]]`, `[[Name#Section]]`, `[[Name|words]]` and `![[Name]]`.
    wikilink: {
      pattern: /!?\[\[[^\]|#\r\n]+(?:#[^\]|\r\n]+)?(?:\|[^\]\r\n]+)?\]\]/,
      greedy: true,
      alias: "url",
      inside: { punctuation: /^!?\[\[|\]\]$|[|#]/ }
    },
    // `[^1]`
    footnote: {
      pattern: /\[\^[^\]\s]+\]/,
      alias: "url"
    },
    // `<https://vowel.cc>`, and a bare `https://vowel.cc` without the
    // punctuation that ends a sentence.
    autolink: {
      pattern: /<(?:https?|mailto):[^\s>]+>|\bhttps?:\/\/[^\s<]*[^\s<.,:;"')\]]/,
      alias: "url"
    },
    // `#tag` after the start of a line or a space: never a heading's
    // `# `, a salt's `##` or the `#` in `a#b`.
    hashtag: {
      pattern: /(^|[ \t])#[\w\-/]+\b/m,
      lookbehind: true,
      alias: "tag"
    },
    // `:name:` and `:folder/name:`, an emoji or an icon.
    shortcode: {
      pattern: /:[a-z0-9_+-]+(?:\/[a-z0-9_+-]+)?:/,
      alias: "symbol"
    },
    // `==highlighted==`
    mark: {
      pattern: /==(?=\S)[^=\r\n]*\S==/,
      alias: "important"
    }
  })
}
