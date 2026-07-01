import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import {toHtml} from 'hast-util-to-html'


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
