import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import {toHtml} from 'hast-util-to-html'
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
    letters[0] = letters[0].toUpperCase()
    return letters.join("")
  }).join(" ")
}

export function createHashtagPage(tag) {
  const markdown = `# ${toTitleCase(tag)}\n\n/**?tag=${tag}`
  const mdast = fromMarkdown(markdown)

  return mdast
}
