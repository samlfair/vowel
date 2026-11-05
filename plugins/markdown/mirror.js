import path from "node:path"
import { contentSection } from "../xml/entryContent.js"
import { markdownBody } from "../atproto/body.js"
import { isMirrored } from "../../utils.js"

/** @import * as Votive from "votive" */

/**
 * A page's markdown mirror: `/blog/post.md` beside `/blog/post`, the post
 * as the reader sees it, in portable markdown. Off by default. The root
 * settings.md's `markdown_mirror: true` mirrors every page, and a page's
 * own `markdown_mirror` overrides it; a page with `html_file: false`
 * is mirrored only when it asks itself, which makes a page whose only
 * file is its markdown.
 *
 * A mirror is a stub of its own source type, `.markdownmirror`, so the
 * markdown processor never reads it as a page. Its stub path is the
 * page's *target* path, which routing has already lowercased and
 * hashed, so a secret page's mirror sits beside its hashed url. A page
 * that stops being mirrored is no longer declared, and votive removes
 * its mirror and the file.
 *
 * The enumerator sees only the root's settings, so a subfolder's
 * settings.md cannot switch mirrors (the markdown read warns).
 * @type {Votive.ProcessorStubs}
 */
function createStubs({ api, settings }) {
  const siteMirrors = settings.lastNonNull("markdown_mirror") === true

  // Off by default, and then only a page that asks for its own mirror
  // can have one: one filtered query rather than every page on every pass.
  const candidates = siteMirrors
    ? api.targets({ folder: "", recursive: true })
    : api.targets({ folder: "", recursive: true, query: { markdown_mirror: true } })

  const pages = candidates.filter(page => isMirrored(page, siteMirrors))
  return pages.map(page => ({
    path: page.path.replace(/\.html$/, ".markdownmirror"),
    params: { page: page.path }
  }))
}

/** @type {Votive.ProcessorExpand} */
function expandStubs({ params }) {
  return { text: params.page }
}

/**
 * A long date in English, as the page shows it, read in UTC: a date is
 * stored as UTC midnight, and local time west of UTC is the day before.
 * @param {string} iso
 */
function longDate(iso) {
  const date = new Date(iso)
  if (isNaN(Number(date))) return undefined
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
}

/**
 * The mirror is made from the page's rendered `section#content`, not
 * from the author's source, whose wikilinks, listing directives and
 * `:icons:` mean nothing outside vowel. The page is a tracked read, so
 * re-rendering it rewrites its mirror.
 *
 * On a pass that writes the mirror before its page, the page's `data` is
 * still its markdown and has no `section#content`. Then nothing is
 * written: the page's write stores its HTML, which restales the mirror,
 * and the same pass writes it again.
 * @type {Votive.ProcessorWrite}
 */
function writeMirror(target, { api, settings }) {
  const page = api.target(target.metadata.markdown_mirror_of)
  if (!page) return

  const section = contentSection(page.data)
  if (!section) return

  // A page without a file has no url of its own, so its mirror names
  // itself.
  const ownURL = "/" + String(target.path).split(path.sep).join("/")
  const pagePath = page.write === false ? ownURL : page.metadata.prettyURL
  const domain = settings.lastNonNull("fm_domain")
  const origin = domain ? (String(domain).startsWith("http") ? String(domain) : "https://" + domain) : undefined
  const url = origin ? new URL(pagePath, origin).href : pagePath

  const title = page.metadata.title
  const date = page.metadata.date ? longDate(page.metadata.date) : undefined
  const byline = [date, url].filter(part => part).join(" · ")
  const body = markdownBody(section, url)

  const parts = [title ? `# ${title}` : undefined, byline, body].filter(part => part)
  return { data: parts.join("\n\n") + "\n" }
}

/**
 * The stub's processor. Its router puts `blog/post.markdownmirror` at
 * `blog/post.md`.
 * @type {Votive.VotiveProcessor}
 */
const mirrorStubs = {
  extensions: [".markdownmirror"],
  format: "text",
  router: ({ dir, name }) => ({ dir, name, ext: ".md" }),
  createStubs,
  expandStubs,
  readFile: (source) => ({ data: "", metadata: { markdown_mirror_of: source.text } })
}

/**
 * The only processor that writes `.md` targets. It reads nothing, so it
 * needs no format: every `.md` source is the markdown processor's. A
 * write is matched on the target's extension, so a second `writeFile`
 * for `.md` would run on every mirror too.
 * @type {Votive.VotiveProcessor}
 */
const mirrorWriter = {
  extensions: [".md"],
  writeFile: writeMirror
}

export { mirrorStubs, mirrorWriter }
