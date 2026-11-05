import {fromMarkdown} from 'mdast-util-from-markdown'
import {toHast} from 'mdast-util-to-hast'
import path from "node:path"
import { randomUUID } from "node:crypto"
import { isSecretPath, displayPath } from "./secretPaths.js"

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


/**
 * The classes that place a page in the site, for `<body>` and for the
 * page's card in a listing: one per folder it's in, from the top, and
 * one for the page. `/` is `page_home`; `/blog/travel/hello-world` is
 * `folder_blog folder_blog_travel page_blog_travel_hello-world`.
 *
 * From the published url, except where a segment is secret: there the
 * author's name for it, without the salt, as the breadcrumb shows it
 * (per Sam) - `blog/secret##purple-moon/hello-world.md` is
 * `folder_blog folder_blog_secret page_blog_secret_hello-world`, never
 * the hash and never the salt. Routing keeps a source's depth, so its
 * segments line up with the url's. `_` joins segments, so one inside a
 * segment becomes `-`, and a space becomes `-` too.
 * @param {string | undefined} prettyURL
 * @param {string} [source] - the page's source path, project-relative
 * @returns {string[]}
 */
export function pageClasses(prettyURL, source) {
  const urlSegments = String(prettyURL ?? "").split("/").filter(Boolean)
  const sourceSegments = typeof source === "string" ? source.split(/[\\/]/) : []
  const named = typeof source === "string" ? displayPath(source).split(/[\\/]/) : []
  const segments = urlSegments
    .map((segment, index) => isSecretPath(sourceSegments[index] ?? "") ? path.parse(named[index]).name.toLowerCase() : segment)
    .map(segment => segment.replace(/[_\s]+/g, "-"))
  if (!segments.length) return ["page_home"]
  const folders = segments.slice(0, -1).map((_, index) => `folder_${segments.slice(0, index + 1).join("_")}`)
  return [...folders, `page_${segments.join("_")}`]
}

/**
 * A title or breadcrumb inferred from a name - a file's, a folder's, a
 * tag's. A name the author cased themselves (any capital letter) is
 * theirs, kept as written: `Hello World`, `iPhone notes`, `README`. An
 * all-lowercase one is sentence-cased, its hyphens and underscores read
 * as spaces: `hello-world` → "Hello world", `#machine-learning` →
 * "Machine learning". Some names read awkwardly (`api-design` → "Api
 * design"); per Sam, that's accepted - no rule handles every case.
 * @param {string | undefined} name
 * @returns {string | undefined}
 */
export function labelFromName(name) {
  if (!name) return name
  if (/\p{Lu}/u.test(name)) return name
  const spaced = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function toTitleCase(string) {
  if (!string) return
  return string.split(" ").map(word => {
    const letters = word.split("")
    letters[0] = letters[0]?.toUpperCase()
    return letters.join("")
  }).join(" ")
}

/**
 * A tag page's markdown: a title and the glob directive that lists every
 * page carrying the tag.
 *
 * Returns *markdown*, not hast. It used to return a parsed tree, because
 * its caller stamped that straight onto a target it created. The tag page
 * is a stub now, so this is the content of a source file and the ordinary
 * markdown read parses it - which is what gives a tag page an inferred
 * title, a routed prettyURL and a tracked listing without special cases.
 */
export function createHashtagPage(tag) {
  return `# ${labelFromName(tag)}\n\n/**?tag=${tag}`
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
 * is vowel's business. `html_file: false` is what produces them now; a
 * secret page used to leave one at its public path as well, which is gone
 * along with the rest of `secret_key`.
 *
 * **Hidden targets** are the replacement for that, and the filter that
 * matters most: a page under a secret path segment is published at a
 * hashed URL and must not appear in a listing, a menu, the sitemap or the
 * feed. Listing one publishes the secret, which is the single thing the
 * feature exists to prevent - so the check lives here, in the one
 * function every listing goes through.
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
  return api.targets(query).filter(isListedPage)
}

/**
 * listPages' rule on one target, for a caller that has a listing in
 * hand already and wants the pages out of it without listing again.
 * @param {any} target
 */
export function isListedPage(target) {
  return target.write !== false
    && target.extension === ".html"
    && !target.metadata?.hidden
}

/**
 * A page its author gave no file, on purpose (`html_file: false`). It has
 * no url, but it is a page: shown wherever one can be without a link to
 * it - a listing's card, a table row, a feed entry - which is what
 * makes card-only and feed-only pages possible. Not in a nav, the
 * sitemap, backlinks or a wikilink: those are links. Another target
 * with no file (a deleted page) isn't this.
 * @param {any} target
 */
export function isPageWithoutFile(target) {
  return target.write === false && target.metadata?.html_file === false
}

/**
 * Whether a page has a markdown mirror (plugins/markdown/mirror.js).
 * The root settings.md's `markdown_mirror` switches every page, and the
 * page's own key overrides it. A page without a file is mirrored only
 * when it asks itself: `html_file: false` used to mean "published
 * nowhere", and switching mirrors on for a site must not publish it.
 * Another virtual page (`status: deleted`) is never mirrored.
 * @param {any} page
 * @param {boolean} siteMirrors - the root settings.md's `markdown_mirror`
 */
export function isMirrored(page, siteMirrors) {
  if (page.extension !== ".html") return false
  const own = page.metadata?.markdown_mirror
  if (isPageWithoutFile(page)) return own === true
  if (page.write === false) return false
  return typeof own === "boolean" ? own : siteMirrors
}

/**
 * Where a page's mirror is: `blog/post.html` → `blog/post.md`.
 * @param {string} pagePath - a stored target path
 */
export function mirrorPath(pagePath) {
  return pagePath.replace(/\.html$/, ".md")
}

/**
 * listPages, plus pages without a file: for listings, cards and the
 * feed, which can show a page without linking to it.
 * @param {{targets: (query: object) => any[]}} api
 * @param {object} query
 */
export function showPages(api, query) {
  return api.targets(query).filter(target => isListedPage(target) || (
    isPageWithoutFile(target) && target.extension === ".html" && !target.metadata?.hidden
  ))
}
