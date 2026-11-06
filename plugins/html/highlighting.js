import { refractor } from "refractor"
import graphql from "refractor/graphql"
import jsx from "refractor/jsx"
import shellSession from "refractor/shell-session"
import toml from "refractor/toml"
import tsx from "refractor/tsx"
import wasm from "refractor/wasm"
import { extendMarkdown } from "./markdownGrammar.js"

/**
 * Syntax highlighting for fenced code: Prism's grammars, through
 * refractor, which returns a hast tree. Prism replaced highlight.js
 * (vowel 0.8) because highlight.js's markdown grammar knew neither
 * frontmatter, comments nor GFM, and Vowel's code blocks are mostly
 * Vowel's own markup; Prism is as fast (markdownGrammar.js).
 *
 * refractor's common set is 62 languages. These are added so that every
 * name highlight.js answered to still highlights: the languages it had
 * and refractor's common set doesn't, and the other spellings of the
 * ones it does.
 */
refractor.register(graphql)
refractor.register(jsx)
refractor.register(shellSession)
refractor.register(toml)
refractor.register(tsx)
refractor.register(wasm)

refractor.alias({
  bash: ["zsh"],
  c: ["h"],
  cpp: ["cc", "c++", "h++", "hpp", "hh", "hxx", "cxx"],
  csharp: ["c#"],
  diff: ["patch"],
  go: ["golang"],
  graphql: ["gql"],
  javascript: ["mjs", "cjs"],
  json: ["jsonc", "json5"],
  makefile: ["mk", "mak", "make"],
  markdown: ["mkdown", "mkd"],
  markup: ["xhtml", "xsd", "xsl", "plist"],
  "objectivec": ["mm", "obj-c"],
  perl: ["pl", "pm"],
  python: ["ipython"],
  ruby: ["gemspec", "podspec", "irb"],
  rust: ["rs"],
  "shell-session": ["console"],
  typescript: ["mts", "cts"],
  vbnet: ["vb"]
})

extendMarkdown(refractor)

/**
 * `code` highlighted as `language`, as hast, or undefined for a
 * language Prism doesn't know. Matched case-insensitively, as a fence's
 * language was by highlight.js.
 * @param {string} code
 * @param {string} language
 * @returns {import("hast").Root | undefined}
 */
export function highlightCode(code, language) {
  const name = language.toLowerCase()
  if (!refractor.registered(name)) return undefined
  return refractor.highlight(code, name)
}
