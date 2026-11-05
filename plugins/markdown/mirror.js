import path from "node:path"
import { contentSection } from "../xml/entryContent.js"
import { markdownBody } from "../atproto/body.js"
import { isMirrored, isListedPage, mirrorPath, labelFromName } from "../../utils.js"

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

/** How long an entry's description in `llms.txt` may be, in characters. */
const LLMS_DESCRIPTION_LENGTH = 200

/**
 * A description on one line, cut at a word boundary.
 * @param {unknown} text
 */
function oneLine(text) {
  if (typeof text !== "string") return undefined
  const flat = text.replace(/\s+/g, " ").trim()
  if (flat.length <= LLMS_DESCRIPTION_LENGTH) return flat || undefined
  const cut = flat.slice(0, LLMS_DESCRIPTION_LENGTH)
  return cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length) + "…"
}

/**
 * Dated pages newest first, then the rest by title.
 * @param {any} a
 * @param {any} b
 */
function newestFirst(a, b) {
  const left = a.metadata.date ?? ""
  const right = b.metadata.date ?? ""
  if (left !== right) return left < right ? 1 : -1
  return String(a.metadata.title ?? a.path).localeCompare(String(b.metadata.title ?? b.path))
}

/**
 * `llms.txt`, the table of contents of a site's mirrors, in the format
 * llmstxt.org proposes: the site's name, its slogan as a blockquote, and
 * a list of links per section. It exists with the root's
 * `markdown_mirror` and a `domain`, since every link is absolute; an
 * author's own `llms.txt` shadows it.
 *
 * - **Sections**: the root's pages under "Pages", the homepage first;
 *   then one per top-level folder, by its label, the order the header
 *   nav lists them in, with every page below it.
 * - **Entries** link the page's mirror, with its description: dated
 *   pages newest first, then the rest by title.
 * - **Left out**: whatever a listing leaves out (hidden, secret, draft,
 *   deleted, a page without a file), a page that opts out of its mirror,
 *   the tag pages, and folder indexes, whose section is the listing.
 *
 * Made in the enumerator, which lists the site anyway on every pass, and
 * carried in the stub's params, so the file is expanded again only when
 * its text changes. Not a write of its own: every `.txt` target is the
 * robots processor's to read and write, and a second `.txt` writer would
 * run on `robots.txt` too.
 * @type {Votive.ProcessorStubs}
 */
function createLLMsStubs({ api, settings }) {
  const domain = settings.lastNonNull("fm_domain")
  if (settings.lastNonNull("markdown_mirror") !== true || !domain) return []
  const origin = String(domain).startsWith("http") ? String(domain) : "https://" + domain

  const listed = api.targets({ folder: "", recursive: true })
    .filter(page => isListedPage(page) && isMirrored(page, true))
  const folders = new Set(listed.map(page => page.dir).filter(dir => dir))
  const isIndex = (page) => folders.has(page.path.replace(/\.html$/, ""))
  const isTags = (page) => page.path === "tags.html" || page.path.split(path.sep)[0] === "tags"
  const pages = listed.filter(page => !isIndex(page) && !isTags(page))

  const home = api.target("index.html")
  const entry = (page) => {
    const url = new URL("/" + mirrorPath(page.path).split(path.sep).join("/"), origin).href
    const title = page.metadata.title || page.metadata.prettyURL
    const description = oneLine(page.metadata.description)
    return `- [${title}](${url})${description ? `: ${description}` : ""}`
  }

  const atRoot = pages.filter(page => page.dir === "")
  const rootSection = [
    ...atRoot.filter(page => page.path === "index.html"),
    ...atRoot.filter(page => page.path !== "index.html").sort(newestFirst)
  ]
  const topFolders = [...new Set(pages.map(page => page.dir.split(path.sep)[0]).filter(dir => dir))]
  const label = (folder) => api.target(`${folder}.html`)?.metadata?.breadcrumb || labelFromName(folder)
  const sections = [
    ...(rootSection.length ? [{ heading: "Pages", pages: rootSection }] : []),
    ...topFolders
      .map(folder => ({ heading: label(folder), pages: pages.filter(page => page.dir.split(path.sep)[0] === folder).sort(newestFirst) }))
      .sort((a, b) => String(a.heading).localeCompare(String(b.heading)))
  ]

  const name = settings.lastNonNull("fm_name") || home?.metadata?.title || "Website"
  const summary = oneLine(home?.metadata?.fm_slogan ?? home?.metadata?.description)
  const text = [
    `# ${name}`,
    ...(summary ? [`> ${summary}`] : []),
    ...sections.map(({ heading, pages }) => `## ${heading}\n\n${pages.map(entry).join("\n")}`)
  ].join("\n\n") + "\n"

  return [{ path: "llms.txt", params: { text } }]
}

/**
 * Declares `llms.txt`; the robots processor reads and writes it.
 * @type {Votive.VotiveProcessor}
 */
const llmsStubs = {
  createStubs: createLLMsStubs,
  expandStubs: ({ params }) => ({ text: params.text })
}

export { mirrorStubs, mirrorWriter, llmsStubs }
