import path from "node:path"
import { h } from "hastscript"
import { toText } from "hast-util-to-text"
import GithubSlugger from "github-slugger"
import { createVisitor, SKIP } from "../markdown/visitor.js"
import { showPages, isPageWithoutFile, imageSizes, sourceLocation } from "../../utils.js"
import { globClasses, alertLabel } from "./editor/directives.js"
import createDynamicImage, { derivativeURL } from "./image.js"
import { highlightCode } from "./highlighting.js"
import { displayPath } from "../../secretPaths.js"
import { isExternalURL, externalProperties } from "./externalLinks.js"
import { HEADING_ID_PREFIX, headingAnchor, withHeadingAnchor } from "./headingIds.js"

/**
 * The page's source, at the node a warning is about (utils.js). Nodes
 * parsed from the page carry their line and column; a node the build
 * made does not, and the warning names the file alone.
 * @param {any} node
 * @param {any} target
 */
const at = (node, target) => sourceLocation(target.source ?? target.path, node?.position?.start)

/**
 * The write walk: one pass over a page's hast for everything that
 * renders against other targets, settings or the url store - which is
 * why it is here and not at read (a read runs before its neighbours
 * exist) or at transform (a transform runs once per read and never
 * again; a write re-runs whenever the page is stale, which is exactly
 * when a note, icon or preview it was waiting for has arrived).
 *
 * Context: `{ target, api, config, settings, makeHeader, makeTable,
 * highlighted }`. `highlighted` is set by the highlight rule so the
 * write can link the highlight stylesheet only on pages that need it.
 */


/** @param {any} node */
const isElement = (node) => node?.type === "element"

/** @param {any} node @param {string} name */
const hasClass = (node, name) => Array.isArray(node.properties?.className) && node.properties.className.includes(name)

/** A paragraph whose only content is one text node. */
const soleText = (node) => isElement(node) && node.tagName === "p" && node.children?.length === 1 && typeof node.children[0]?.value === "string"
  ? node.children[0].value
  : null

/** A url this site would serve: not another site, not an anchor, not mailto: and the like. */
const isInternal = (url) => typeof url === "string"
  && url !== ""
  && !/^[a-z][a-z0-9+.-]*:/i.test(url)
  && !url.startsWith("//")
  && !url.startsWith("#")
  && !url.startsWith("?")

/**
 * A url split into its path, decoded, and what follows it (`?query`,
 * `#anchor`). `##` is a secret segment's marker, not an anchor, so it
 * is kept in the path.
 * @param {string} url
 */
function splitURL(url) {
  const masked = url.replaceAll("##", "\0\0")
  const end = masked.search(/[?#]/)
  const cut = end === -1 ? url.length : end
  return { pathname: decodeURIComponent(url.slice(0, cut)), suffix: url.slice(cut) }
}

/** Where a target is served: a page's pretty url, anything else its path. */
const urlOf = (found) => found.metadata?.prettyURL ?? "/" + found.path.split(path.sep).join("/")

/**
 * A path as the browser resolves it from this page: `pic.jpg` on
 * /blog/post is /blog/pic.jpg. Decoded, from the root. `#` is encoded
 * on the way in, so a secret segment's `##` stays in the path.
 * @param {string} pathname - decoded, no query or anchor
 * @param {any} target - the page
 */
function fromPage(pathname, target) {
  const base = new URL(urlOf(target), "thismessage://")
  return decodeURIComponent(new URL(pathname.replaceAll("#", "%23"), base).pathname)
}

/**
 * The target a browser would get for this url from this page, or null
 * for a 404: resolved against the page's own url, then looked up as a
 * file (`/pic.jpg`, `/feed.xml`) or a page (`/about` is about.html). A
 * tracked read, so a page that appears later rewrites the one linking
 * to it.
 * @param {string} pathname - decoded, no query or anchor
 * @param {{ target: any, api: any }} context
 */
function servedTarget(pathname, { target, api }) {
  const resolved = fromPage(pathname, target)
  const trimmed = resolved.length > 1 ? resolved.replace(/\/+$/, "") : resolved
  if (trimmed === "/") return api.target("index.html")
  const file = trimmed.slice(1).split("/").join(path.sep)
  return api.target(file) ?? api.target(`${file}.html`)
}

/** Per config: the extensions its plugins read in the background. */
const backgroundExtensions = new WeakMap()

/**
 * Whether a missing path may only be not read *yet*: a file in the
 * background (format "buffer": images, fonts, documents, video) has no
 * target until its deferred read, which on a cold build runs after the
 * first write pass. A miss there is not a 404, and warning about it
 * flagged 71 of 98 links and images on style-builder whose files were
 * there. So those go unwarned; the miss is tracked, and the page is
 * rewritten with the right link when the file is read. A page link or
 * a wikilink (markdown, read before any write) still warns.
 * @param {string} pathname
 * @param {any} config
 */
function readInBackground(pathname, config) {
  if (!backgroundExtensions.has(config)) {
    const processors = (config.plugins ?? []).flatMap(plugin => plugin.processors ?? [])
    const extensions = processors.filter(processor => processor.format === "buffer").flatMap(processor => processor.extensions ?? [])
    backgroundExtensions.set(config, new Set(extensions))
  }
  return backgroundExtensions.get(config).has(path.extname(pathname).toLowerCase())
}

/**
 * A link to this site: `[text](./post.md)`, `../post.md` or
 * `/blog/post.md` resolves by *source* path to the routed target - for a
 * secret page the hashed one, with no second trip through the router -
 * and an asset (`./pic.jpg`) to its path. Anything else (`/about`,
 * `../tags/x`) is checked as the url it is. A link that goes nowhere
 * is warned about and left as written: the author's to fix, not a
 * reason to stop the build. A file read in the background isn't
 * (readInBackground).
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const internalLink = {
  name: "internalLink",
  test: (node) => isElement(node) && node.tagName === "a" && !hasClass(node, "wikilink") && isInternal(node.properties?.href),
  transform: (node, index, parent, context) => {
    const { target, api, config } = context
    const href = node.properties.href
    const { pathname, suffix } = splitURL(href)
    // A stub has a source path but no neighbours to resolve against.
    const sourcePath = target.source && path.extname(pathname)
      ? path.normalize(pathname.startsWith("/") ? pathname.slice(1) : path.join(path.dirname(target.source), pathname))
      : null
    const found = (sourcePath && api.targetBySource(sourcePath)) || servedTarget(pathname, context)
    if (!found) {
      if (!readInBackground(pathname, config)) config.log?.("warn", `${at(node, target)}: link to ${href} matches no page`)
      return
    }
    // A link to a png or jpeg opens its largest derivative: the
    // original is not published (image.js). A page's anchor is a
    // heading's (headingIds.js); a file's, like a pdf's `#page=2`, isn't.
    const anchored = found.extension === ".html" ? withHeadingAnchor(suffix) : suffix
    node.properties.href = (derivativeURL(found, imageSizes.at(-1)) ?? urlOf(found)) + anchored
  }
}

/**
 * `[x](#kerning)`, an anchor on this page: a heading's, so `#heading_kerning`
 * (headingIds.js). In place, so the walk goes on into its text.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const anchorLink = {
  name: "anchorLink",
  test: (node) => isElement(node) && node.tagName === "a" && typeof node.properties?.href === "string" && node.properties.href.startsWith("#"),
  transform: (node) => {
    node.properties.href = "#" + headingAnchor(node.properties.href.slice(1))
  }
}

/**
 * A link to another site opens in a new tab (externalLinks.js). Any
 * absolute link matches; one to the site's own domain is left as it
 * is, which a test can't tell, since only the transform has the
 * settings. In place, so the walk goes on into its text.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const externalLink = {
  name: "externalLink",
  test: (node) => isElement(node) && node.tagName === "a" && /^(https?:)?\/\//i.test(node.properties?.href ?? ""),
  transform: (node, index, parent, { settings }) => {
    if (!isExternalURL(node.properties.href, settings?.lastNonNull?.("fm_domain"))) return
    node.properties = externalProperties(node.properties)
  }
}

/**
 * A note by name, the way Obsidian finds it - as best we can guess
 * (Sam, Sept 19):
 *
 * - by **filename without extension, case-insensitively**, whatever
 *   folder it is in (`[[Hello World]]` finds `hello world.md` and
 *   `Hello World.md`, never `hello-world.md`), or by one of the note's
 *   `aliases:`;
 * - a **path** narrows it: `[[notes/twin]]` wants a `twin` whose folder
 *   path ends in `notes`, from the vault root or any folder above it;
 * - when several still match, **the nearest wins**: the linking page's
 *   own folder, then the longest shared folder prefix, then the
 *   shortest path, then alphabetical.
 *
 * A filtered listing on `note_key`/`note_aliases` (metadata.js), so a
 * note that appears later restales this page and the write runs again.
 * @param {string} name
 * @param {{ api: any, target: any }} context
 */
function resolveNote(name, { api, target }) {
  const segments = name.trim().replace(/^\/+/, "").split("/").map(segment => segment.trim().toLowerCase()).filter(Boolean)
  const key = segments.at(-1)
  if (!key) return null
  const folderHint = segments.slice(0, -1).join("/")

  const candidates = api.targets({
    folder: "",
    recursive: true,
    query: { "|": { note_key: key, note_aliases: { "~": key } } }
  }).filter(candidate => (
    candidate.write !== false
    && candidate.extension === ".html"
    && candidate.path !== target.path
    && (!folderHint || sourceFolder(candidate).endsWith(folderHint))
  ))

  const here = target.dir.split(path.sep).join("/")
  const rank = (candidate) => {
    const there = candidate.dir.split(path.sep).join("/")
    return [there === here ? 0 : 1, -sharedPrefix(here, there), candidate.path.length, candidate.path]
  }
  return candidates.sort((a, b) => {
    const [ad, as, al, ap] = rank(a)
    const [bd, bs, bl, bp] = rank(b)
    return ad - bd || as - bs || al - bl || (ap < bp ? -1 : ap > bp ? 1 : 0)
  })[0] ?? null
}

/** A candidate's source folder as the author sees it: salts stripped, lowercase, forward slashes. */
function sourceFolder(candidate) {
  const source = candidate.source ? displayPath(candidate.source) : candidate.path
  return path.dirname(source).split(path.sep).join("/").toLowerCase().replace(/^\.$/, "")
}

/** How many leading folder segments two folder paths share. */
function sharedPrefix(a, b) {
  const as = a ? a.split("/") : []
  const bs = b ? b.split("/") : []
  const shared = as.findIndex((segment, index) => segment !== bs[index])
  return shared === -1 ? as.length : shared
}

/**
 * A file by name (`[[Hello World.jpeg]]`): beside the page, then at the
 * root.
 * @param {string} name
 * @param {{ api: any, target: any }} context
 */
function resolveFile(name, { api, target }) {
  const lower = name.trim().toLowerCase()
  return api.target(path.join(target.dir, lower)) ?? api.target(lower) ?? null
}

/**
 * The read parsed `[[Name#Section|text]]` into `<a class=wikilink
 * data-note data-section>text</a>`; this gives it an href. Unresolved
 * stays an <a> with no href - never a span.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const wikilink = {
  name: "wikilink",
  test: (node) => isElement(node) && node.tagName === "a" && hasClass(node, "wikilink") && typeof node.properties?.dataNote === "string",
  transform: (node, index, parent, context) => {
    const name = node.properties.dataNote
    const section = node.properties.dataSection
    const isFile = /\.[a-z0-9]+$/i.test(name.trim())
    const found = isFile ? resolveFile(name, context) : resolveNote(name, context)
    if (!found) {
      const { target, config } = context
      config.log?.("warn", `${at(node, target)}: [[${name}]] matches no page`)
      delete node.properties.href
      return SKIP
    }
    const url = found.metadata?.prettyURL ?? `/${found.path}`
    const anchor = section ? `#${HEADING_ID_PREFIX}${new GithubSlugger().slug(section)}` : ""
    node.properties.href = url + anchor
    return SKIP
  }
}

/**
 * `:fa/surfer:` is `fa/surfer.svg` in the project, read through
 * api.target() so a replaced icon restales the page. The same shape as
 * a#logo - an <img> plus --url-icon - so a monochrome SVG can be masked
 * in currentColor. Missing: the shortcode is put back as written.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const icon = {
  name: "icon",
  test: (node) => isElement(node) && node.tagName === "img" && hasClass(node, "icon") && typeof node.properties?.dataIcon === "string",
  transform: (node, index, parent, { api }) => {
    const name = node.properties.dataIcon
    const found = api.target(`${name}.svg`)
    if (!found) return { type: "text", value: `:${name}:` }
    const src = `/${found.path}`
    node.properties.src = src
    node.properties.style = `--url-icon: url("${src}")`
    return SKIP
  }
}

/**
 * A fenced block with a language, highlighted by Prism
 * (highlighting.js): per-token spans in the <code>, and the language
 * class on the <pre> as well as the <code>, where Prism's themes look
 * for it. A language Prism doesn't know is left alone.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const highlight = {
  name: "highlight",
  test: (node) => isElement(node) && node.tagName === "pre" && isElement(node.children?.[0]) && node.children[0].tagName === "code",
  transform: (node, index, parent, context) => {
    const code = node.children[0]
    const language = (code.properties?.className ?? []).map(String).find(name => name.startsWith("language-"))?.slice("language-".length)
    if (!language) return SKIP
    const result = highlightCode(toText(code, { whitespace: "pre" }), language)
    if (!result) return SKIP
    const preClasses = (node.properties?.className ?? []).map(String).filter(name => !name.startsWith("language-"))
    node.properties = { ...node.properties, className: [...preClasses, `language-${language}`] }
    if (result.children.length) code.children = result.children
    context.highlighted = true
    return SKIP
  }
}

/** The stand-in size of an image not read yet: 3:2, the commonest photo shape. */
const PENDING_WIDTH = 1500
const PENDING_HEIGHT = 1000

/** An image in the text, not an inline icon (`:folder/name:`). @param {any} node */
const isImage = (node) => isElement(node) && node.tagName === "img" && !hasClass(node, "icon")

/**
 * A paragraph that starts with an image and goes on is a captioned
 * image: the paragraph becomes a <figure>, and what follows the image
 * its <figcaption>. In place, so the walk goes on into both (the image
 * rule makes the <picture>, the inline rules read the caption) and a
 * natural image's mark (`data-metadata`) stays on the element the html
 * plugin lifts. The <figure> used to go inside the <p>, where it is not
 * allowed: a browser closed the paragraph before it and left an empty
 * one behind.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const captionedImage = {
  name: "captioned image",
  test: (node) => isElement(node) && node.tagName === "p" && isImage(node.children?.[0])
    && node.children.slice(1).some(child => child.type !== "text" || child.value.trim()),
  transform: (node) => {
    const [img, ...caption] = node.children
    node.tagName = "figure"
    node.properties = { ...node.properties, className: [...(node.properties?.className ?? []), "image"] }
    node.children = [img, h("figcaption", caption)]
  }
}

/**
 * A project image becomes a responsive <picture>.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const image = {
  name: "image",
  test: isImage,
  transform: (node, index, parent, context) => {
    const { api, target } = context
    const { src, alt } = node.properties
    // createDynamicImage reads a path from the root; a relative one
    // (`pic.jpg`, `./pic.jpg`, `../pic.jpg`) is the page's, so resolve it
    // first. It used to be looked up at the root, miss, and stay a
    // plain <img>: shown, but never optimised.
    const relative = isInternal(src) && !src.startsWith("/")
    const picture = createDynamicImage(relative ? fromPage(splitURL(src).pathname, target) : src, api, alt)
    if (!picture) {
      // Left as an <img>. One whose file is read in the background may
      // only be not read yet; any other miss is a 404, said so.
      const { pathname } = isInternal(src) ? splitURL(src) : {}
      if (!pathname || servedTarget(pathname, context)) return SKIP
      if (!readInBackground(pathname, context.config)) {
        context.config.log?.("warn", `${at(node, context.target)}: image ${src} matches no file`)
        return SKIP
      }
      // Not read yet, so its size is unknown. A 3:2 box stands in (the
      // reset sizes an <img> from its attributes, capped at the column),
      // so the page doesn't jump when the read rewrites it at its own size.
      if (node.properties.width !== undefined || node.properties.height !== undefined) return SKIP
      node.properties.width = PENDING_WIDTH
      node.properties.height = PENDING_HEIGHT
      return SKIP
    }
    return picture
  }
}

/**
 * A paragraph that is just a path: `/blog/post` is a reference card,
 * `/blog/*` and `/blog/**` are listings, with the query string as the
 * listing's parameters. Every parameter is carried in the class list so
 * the editor can collapse the expansion back to the directive
 * (plugins/html/editor/directives.js).
 *
 * Two spellings, two address spaces (Sam, Sept 19). An absolute path
 * (`/blog/*`) is a *published* path and names targets. A relative one
 * (`./posts/*`, `../notes/x`) is a *source* path, resolved against the
 * page's own file and then routed - which is the only way to list a
 * secret folder, since the salt lives in the source name
 * (`./members##autumn-glaze/*`) and the listing renders the hashed
 * urls. A `##` in an absolute path can match nothing, and the paragraph
 * is dropped rather than rendered: a salt never reaches output.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const directive = {
  name: "directive",
  test: (node) => /^(\/|\.\.?\/)\S*$/.test(soleText(node) ?? ""),
  transform: (node, index, parent, { target, api, config, makeHeader, makeTable }) => {
    const value = node.children[0].value
    const relative = !value.startsWith("/")

    if (!relative && value.includes("##")) {
      config.log?.("error", `${at(node, target)}: a listing by published path cannot name a secret folder (${value}); write it relative to this file, as \`./…\``)
      return []
    }

    // A relative path is joined to this file's folder in source space
    // and sent through the router cascade, so the folder or page it
    // names is the published one, hashed if secret. `#` is not a url
    // character (it starts a fragment), so the query string is split
    // off before anything is parsed as a url.
    const [pathPart, search = ""] = value.split("?")
    const routed = relative
      ? routeRelative(pathPart, target, config)
      : pathPart
    if (routed === undefined) {
      config.log?.("warn", `${at(node, target)}: ${value} cannot be resolved from a page with no source file`)
      return SKIP
    }
    const url = new URL(routed, "thismessage://")
    if (search) url.search = search
    const { dir, base } = path.parse(url.pathname)
    const recursive = base === "**"
    const many = base === "*" || base === "**"

    if (!many) {
      const info = path.parse(url.pathname)
      info.ext ||= ".html"
      delete info.base
      // Lowercased: every vowel target path is (config.js's router).
      const found = api.target(path.relative("/", path.format(info)).toLowerCase())
      if (!found) return SKIP
      return asReference(makeHeader(found.metadata, cardLink(found), api, config, found.source))
    }

    const folder = path.relative("/", dir)
    const count = url.searchParams.get("count")
    const tag = url.searchParams.get("tag")
    const view = url.searchParams.get("view")
    // ?properties=title,description,image picks the table's columns, in
    // order. A name is looked up as written, then with the fm_ prefix.
    const properties = (url.searchParams.get("properties") || "").split(",").map(name => name.trim()).filter(Boolean)
    const query = tag ? { tags: { "~": tag } } : {}

    // A relative glob is in source space, where the author named the
    // folder salt and all, so it sees the hidden (secret) pages there;
    // a published-path glob never does. A page hidden on purpose
    // (`status: hidden`) is hidden from both.
    const listing = { folder, recursive, query, orderBy: { property: "date", direction: "desc" }, limit: count ? Number(count) : undefined }
    const targets = relative
      ? api.targets(listing).filter(page => (page.write !== false || isPageWithoutFile(page)) && page.extension === ".html" && page.metadata.fm_status !== "hidden")
      : showPages(api, listing)

    const listClasses = globClasses({ folder, recursive, limit: count, tag, view, properties })

    return view === "table"
      ? makeTable(listClasses, properties.length ? properties : ["title"], targets, api)
      : h("ul", { class: listClasses }, targets.map(found => h("li", makeHeader(found.metadata, cardLink(found), api, config, found.source))))
  }
}

/**
 * Where a card links: the page's url, or nowhere for a page with no
 * file (`html_file: false`), which is a card and nothing more.
 * @param {any} found
 */
const cardLink = (found) => isPageWithoutFile(found) ? null : found.metadata.prettyURL

/**
 * A reference card's <article> marked `reference`, which a listing's
 * cards aren't: `<a><article class=reference>`, or the article alone for
 * a page with no file. The editor's ingest reads it to put `/blog/post`
 * back.
 * @param {any} card - makeHeader's result
 */
function asReference(card) {
  const article = card.tagName === "article" ? card : card.children[0]
  article.properties.className = [...(article.properties.className ?? []), "reference"]
  return card
}

/**
 * A relative directive path as the absolute published path it names.
 * The glob's last segment (`*`, `**`) rides along untouched: the
 * cascade hashes and lowercases segments and leaves those alone.
 * @param {string} value - `./members##salt/*`, `../notes/x`
 * @param {{source?: string | null}} target - the page being written
 * @param {{router?: (sourcePath: string) => string}} config
 * @returns {string | undefined} `/studio/<hash>/*`, or undefined for a
 *   page with no source to resolve against (a stub)
 */
function routeRelative(value, target, config) {
  if (!target.source) return undefined
  const sourcePath = path.normalize(path.join(path.dirname(target.source), value))
  const routed = config.router ? config.router(sourcePath) : sourcePath
  return "/" + routed.split(path.sep).join("/")
}

/**
 * A paragraph that is just a url is a link preview. api.url() both
 * reads and asks: nothing fetched yet leaves the paragraph as written,
 * and the fetch landing restales this page.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const preview = {
  name: "preview",
  test: (node) => /^https?:\/\/\S+$/.test(soleText(node) ?? ""),
  transform: (node, index, parent, { api }) => {
    const url = node.children[0].value
    const data = api.url(url)
    if (!data) return SKIP
    return h("a.link-preview", { href: url, target: "_blank", rel: "noopener noreferrer" }, [
      data.image ? h("img.link-preview-image", { src: data.image, alt: "" }) : null,
      h("span.link-preview-body", [
        h("span.link-preview-title", data.title || url),
        data.description ? h("span.link-preview-description", data.description) : null
      ].filter(Boolean))
    ].filter(Boolean))
  }
}

/** `[!TYPE]` at the very start of an alert, and the spaces after it. */
const ALERT_MARKER = /^\[!([a-z][\w-]*)\][ \t]*/i

/** A blockquote's first block, if it is a paragraph that opens with `[!TYPE]`. */
const alertParagraph = (node) => {
  const first = node.children?.find(isElement)
  const lead = first?.tagName === "p" ? first.children?.[0] : null
  return typeof lead?.value === "string" && ALERT_MARKER.test(lead.value) ? first : null
}

/**
 * A GFM alert, or an Obsidian callout: a blockquote whose first line is
 * `[!TYPE]`, any word, becomes `<aside class="alert type">` with a
 * heading. The rest of that line is the heading (`> [!NOTE] How to
 * render`, inline markdown and all), else the type in sentence case
 * (alertLabel). Both spellings work: GitHub's, with the text on the
 * next line - one paragraph, so the marker line is cut off the front of
 * it - and the marker alone, then a blank `>` line.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const alert = {
  name: "alert",
  test: (node) => isElement(node) && node.tagName === "blockquote" && alertParagraph(node) !== null,
  transform: (node) => {
    const paragraph = alertParagraph(node)
    const [lead, ...rest] = paragraph.children
    const marker = ALERT_MARKER.exec(lead.value)
    const type = marker[1].toLowerCase()

    // The marker's line ends at the first newline: what comes before it
    // is the title, what comes after is the paragraph.
    const inline = [{ type: "text", value: lead.value.slice(marker[0].length) }, ...rest]
    const breakAt = inline.findIndex(child => typeof child.value === "string" && child.value.includes("\n"))
    const lineEnd = breakAt === -1 ? inline.length : breakAt
    const split = breakAt === -1 ? null : inline[breakAt].value.indexOf("\n")
    const title = [
      ...inline.slice(0, lineEnd),
      ...(split === null ? [] : [{ type: "text", value: inline[breakAt].value.slice(0, split) }])
    ]
    const body = split === null ? [] : [
      { type: "text", value: inline[breakAt].value.slice(split + 1) },
      ...inline.slice(breakAt + 1)
    ]

    const hasTitle = title.some(child => child.type !== "text" || child.value.trim())
    const heading = h("h2", hasTitle ? trimText(title) : alertLabel(type))
    const hasBody = body.some(child => child.type !== "text" || child.value.trim())

    node.tagName = "aside"
    node.properties = { class: `alert ${type}` }
    const index = node.children.indexOf(paragraph)
    const kept = hasBody ? [{ ...paragraph, children: trimText(body) }] : []
    node.children = [heading, ...node.children.slice(0, index).filter(isElement), ...kept, ...node.children.slice(index + 1)]
  }
}

/**
 * Inline nodes with the whitespace trimmed from both ends of the run.
 * @param {any[]} nodes
 */
function trimText(nodes) {
  const last = nodes.length - 1
  return nodes
    .map((child, index) => {
      if (typeof child.value !== "string" || child.type !== "text") return child
      const start = index === 0 ? child.value.trimStart() : child.value
      return { ...child, value: index === last ? start.trimEnd() : start }
    })
    .filter(child => child.type !== "text" || child.value !== "")
}

const skipped = new Set(["pre", "code", "script", "style"])

const writeWalk = createVisitor({
  block: [internalLink, anchorLink, externalLink, wikilink, icon, highlight, captionedImage, image, directive, preview, alert],
  skip: (node) => isElement(node) && skipped.has(node.tagName)
})

export { writeWalk }
