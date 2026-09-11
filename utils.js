import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import path from "node:path"
import { randomUUID } from "node:crypto"

export const imageSizes = [414, 768, 1440, 1920]
export const imageExts = ["avif", "webp"]

/**
 * @param {object} params
 * @property {string} targetFilePath
 * @property {number} size
 * @property {string} targetDirectory
 * @property {string} uuid
 */
export function createImagePath({ targetFilePath, size, ext, targetDirectory, uuid }) {
  const { dir, name } = path.parse(targetFilePath)
  return path.format({
    dir: path.relative(".", path.normalize(path.join(targetDirectory, dir))),
    name: `${name}-${uuid}-${size}`,
    ext
  })
}

/**
 * @param {string} targetFilePath
 * @param {string} targetDirectory
 * @param {string} uuid
 */
export function createImagePaths(targetFilePath, targetDirectory, uuid) {
  const defaultExt = path.extname(targetFilePath)
  return [...imageExts, defaultExt].map(ext => {
    return imageSizes.map(size => {
      return createImagePath({
        targetFilePath,
        size,
        ext,
        targetDirectory,
        uuid
      })
    })
  })
}

/** @param {string} text */
export function testURL(text) {
  if (text.match(/^https?:\/\/[\S]+$/)) {
    try {
      return new URL(text)
    } catch (e) {
      return
    }
  }
}

export const hashtagRegexSingle = /(^|\s)(#([\w\-\/]+))($|\b)/
export const hashtagRegexGlobal = /(?:^|\s)(#[\w\-\/]+)(?:$|\b)/g

export function testHashtags(text) {
  const match = text.match(hashtagRegexGlobal)
  if(match) return match.map(a => a.trim().slice(1))
}


export function toTitleCase(string) {
  if (!string) return
  return string.split(" ").map(word => {
    const letters = word.split("")
    letters[0] = letters[0]?.toUpperCase()
    return letters.join("")
  }).join(" ")
}

export function createHashtagPage(tag) {
  const markdown = `# ${toTitleCase(tag)}\n\n/**?tag=${tag}`
  const mdast = fromMarkdown(markdown)
  const hast = toHast(mdast)

  return hast
}

/**
 * Every listing in vowel goes through here rather than calling
 * `api.targets()` directly. All five call sites - the tag pages, the
 * breadcrumb family, glob expansions, the nav and the feed - are listing
 * *pages*, which is what the name says and what the two filters mean
 * together.
 *
 * **Virtual targets** (`write: false`) have no file on disk and therefore
 * no URL to link to. Votive keeps them because a plugin may still want to
 * read one back, and votive is right not to care why it is virtual - that
 * is vowel's business. Two of vowel's own features produce them, and both
 * are meant to be invisible: `html_file: false`, and the public target a
 * `secret_key` page leaves behind, whose prettyURL is the secret path.
 * Listing that one publishes the secret.
 *
 * **Non-HTML targets** are not pages either. Several reach a listing:
 * every folder's `settings.md`, emitted as its own target so the
 * settings panel can fetch it; and copy-through assets - fonts, images -
 * which became visible once votive stopped hiding targets that had no
 * abstract. None has a title, so each renders as an empty `<article>`.
 *
 * @param {{targets: (query: object) => any[]}} api
 * @param {object} query
 */
export function listPages(api, query) {
  const targets = api.targets(query)
  return targets.filter(target => target.write !== false && target.extension === ".html")
}
