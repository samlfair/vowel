import path from "node:path"
import { h } from "hastscript"
import { common, createLowlight } from "lowlight"
import { toText } from "hast-util-to-text"
import GithubSlugger from "github-slugger"
import { createVisitor, SKIP } from "../markdown/visitor.js"
import { toTitleCase, listPages } from "../../utils.js"
import { globClasses } from "./editor/directives.js"
import createDynamicImage from "./image.js"
import { displayPath } from "../../secretPaths.js"

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

const lowlight = createLowlight(common)

/** @param {any} node */
const isElement = (node) => node?.type === "element"

/** @param {any} node @param {string} name */
const hasClass = (node, name) => Array.isArray(node.properties?.className) && node.properties.className.includes(name)

/** A paragraph whose only content is one text node. */
const soleText = (node) => isElement(node) && node.tagName === "p" && node.children?.length === 1 && typeof node.children[0]?.value === "string"
  ? node.children[0].value
  : null

/**
 * `[text](./post.md)` resolves by *source* path to the routed target -
 * which for a secret page is the hashed one, with no second trip
 * through the router. The href may arrive percent-encoded (toHast
 * normalizes non-ASCII). A link to a file that produces no page is the
 * author's to notice, not a reason to stop the build.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const relativeLink = {
  name: "relativeLink",
  test: (node) => isElement(node) && node.tagName === "a" && typeof node.properties?.href === "string" && node.properties.href.startsWith("./"),
  transform: (node, index, parent, { target, api, config }) => {
    // A stub has a source path but no neighbours to resolve against.
    if (!target.source) return
    const sourcePath = path.normalize(path.join(path.dirname(target.source), decodeURIComponent(node.properties.href)))
    const found = api.targetBySource(sourcePath)
    if (!found) {
      config.log?.("warn", `${target.source}: link to ${node.properties.href} matches no page`)
      return
    }
    node.properties.href = found.metadata.prettyURL
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
    candidate.extension === ".html"
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
      delete node.properties.href
      return SKIP
    }
    const url = found.metadata?.prettyURL ?? `/${found.path}`
    const anchor = section ? `#${new GithubSlugger().slug(section)}` : ""
    node.properties.href = url + anchor
    return SKIP
  }
}

/**
 * `:fa/surfer:` is `fa/surfer.svg` in the project, read through
 * api.target() so a replaced icon restales the page. The same shape as
 * a#logo - an <img> plus --icon-url - so a monochrome SVG can be masked
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
    node.properties.style = `--icon-url: url("${src}")`
    return SKIP
  }
}

/**
 * A fenced block with a language: what rehype-highlight did, without
 * its walk. hljs plus per-token spans on the <code>; the language class
 * is left for the stylesheet. An unregistered language is left alone.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const highlight = {
  name: "highlight",
  test: (node) => isElement(node) && node.tagName === "pre" && isElement(node.children?.[0]) && node.children[0].tagName === "code",
  transform: (node, index, parent, context) => {
    const code = node.children[0]
    const language = (code.properties?.className ?? []).map(String).find(name => name.startsWith("language-"))?.slice("language-".length)
    if (!language) return SKIP
    let result
    try {
      result = lowlight.highlight(language, toText(code, { whitespace: "pre" }))
    } catch (error) {
      if (/Unknown language/.test(error.message)) return SKIP
      throw error
    }
    code.properties.className = ["hljs", ...code.properties.className.filter(name => name !== "hljs")]
    if (result.children.length) code.children = result.children
    context.highlighted = true
    return SKIP
  }
}

/**
 * A project image becomes a responsive <picture>; first in its
 * paragraph with siblings after it, those are its caption.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const image = {
  name: "image",
  test: (node) => isElement(node) && node.tagName === "img" && !hasClass(node, "icon"),
  transform: (node, index, parent, { api }) => {
    const { src, alt } = node.properties
    const picture = createDynamicImage(src, api, alt)
    if (!picture) return SKIP
    if (index === 0 && parent.children.length > 1) {
      const caption = parent.children.slice(1)
      parent.children = [h("figure", [picture, h("figcaption", caption)])]
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
      config.log?.("error", `${target.source ?? target.path}: a listing by published path cannot name a secret folder (${value}); write it relative to this file, as \`./…\``)
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
      config.log?.("warn", `${target.path}: ${value} cannot be resolved from a page with no source file`)
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
      return makeHeader(found.metadata, found.metadata.prettyURL, api, config)
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
    // a published-path glob never does.
    const listing = { folder, recursive, query, orderBy: { property: "date", direction: "desc" }, limit: count ? Number(count) : undefined }
    const targets = relative
      ? api.targets(listing).filter(page => page.write !== false && page.extension === ".html")
      : listPages(api, listing)

    const listClasses = globClasses({ folder, recursive, limit: count, tag, view, properties })

    return view === "table"
      ? makeTable(listClasses, properties.length ? properties : ["title"], targets, api)
      : h("ul", { class: listClasses }, targets.map(found => h("li", makeHeader(found.metadata, found.metadata.prettyURL, api, config))))
  }
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

/**
 * A GFM alert: a blockquote whose first line is `[!NOTE]` (or WARNING,
 * DANGER...) becomes an aside with the label as its heading.
 * @type {import("../markdown/visitor.js").BlockRule}
 */
const alert = {
  name: "alert",
  test: (node) => isElement(node) && node.tagName === "blockquote"
    && isElement(node.children?.[1]) && node.children[1].tagName === "p"
    && node.children[1].children?.length === 1
    && /^\[!(\w+)\]$/.test(node.children[1].children[0].value ?? ""),
  transform: (node) => {
    const [, label] = node.children[1].children[0].value.match(/^\[!(\w+)\]$/)
    node.tagName = "aside"
    node.properties = { class: `alert ${label.toLowerCase()}` }
    node.children.splice(0, 2, h("h2", toTitleCase(label)))
  }
}

const skipped = new Set(["pre", "code", "script", "style"])

const writeWalk = createVisitor({
  block: [relativeLink, wikilink, icon, highlight, image, directive, preview, alert],
  skip: (node) => isElement(node) && skipped.has(node.tagName)
})

export { writeWalk }
