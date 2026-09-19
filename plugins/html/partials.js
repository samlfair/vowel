import path from "node:path"
import { h } from "hastscript"
import { listPages } from "../../utils.js"
import { isVowelStylesheet } from "../styles/theme.js"

/**
 * Partials: rendered fragments shared by many pages, built once per
 * pass instead of once per page.
 *
 * The header nav and the aside tree used to be computed inside every
 * page's writeFile from a listing of every page - N listings and N²
 * tracked reads per build (tasks/3-in-review/stress-test-findings.md,
 * B). Now the html processor's enumerator computes the *data* for each
 * partial once, from one untracked listing, and declares it as a
 * virtual stub whose params are that data: votive re-expands it exactly
 * when the data changes. The partial processor's readFile renders the
 * data to hast and stores it as metadata; a page does one tracked read
 * of its partial and walks a copy to mark the current page.
 *
 * Paths: `partials/nav.partial` is the header nav for pages at the
 * root, `partials/nav/<folder>.partial` for pages in a folder - the
 * lists for every level from the root down to that folder, and the
 * project's own stylesheets along that chain (a `.css` the author wrote
 * in any of those folders, with its content hash for the cache-buster).
 * Both are "what this page's folder chain contributes", so they share a
 * stub; the stylesheet half used to be one listing per ancestor per
 * page, whose folder-membership edge restaled every page whenever any
 * file was added at the root. There is
 * one `partials/aside.partial`, the site tree, the same on every page.
 * `partials/backlinks/<page path>.partial` is the "linked from" list
 * of one page, declared only for pages something links to - a page
 * with no linkers reads a miss, which votive tracks, so it is rebuilt
 * the moment a linker appears.
 * `.partial` is an extension nothing else claims, so a project file can
 * never be read as one; the targets are virtual (write: false), which
 * keeps them out of every listing, the sitemap and the feed.
 */

const ASIDE_PARTIAL = path.join("partials", "aside.partial")

/** A page with more siblings than this is left out of the aside. */
const MAX_SIBLINGS = 18

/** @param {string} targetPath - the page's own target path */
function backlinksPartialPath(targetPath) {
  return path.join("partials", "backlinks", `${targetPath}.partial`)
}

/** @param {string} folder - stored form (path.sep), "" for the root */
function navPartialPath(folder) {
  return folder ? path.join("partials", "nav", `${folder}.partial`) : path.join("partials", "nav.partial")
}

/** A page is off when the author set the key to 0 or false. */
const isOn = (value) => value !== 0 && value !== false

/** What the header nav lists in a folder. */
function inHeaderNav(page) {
  return page.path
    && page.extension === ".html"
    && !page.metadata.date
    && page.path !== "index.html"
    && page.path !== "404.html"
    && page.path !== "tags.html"
    && page.dir !== "tags"
    && isOn(page.metadata.local_menu_item)
    && isOn(page.metadata.html_file)
}

/** @param {any} a @param {any} b */
function byBreadcrumb(a, b) {
  if (a.metadata.breadcrumb && b.metadata.breadcrumb) return String(a.metadata.breadcrumb).localeCompare(String(b.metadata.breadcrumb))
  return 0
}

/** The folder and every ancestor, root first: "" , "a", "a/b". */
function chain(folder) {
  if (!folder) return [""]
  const segments = folder.split(path.sep)
  return ["", ...segments.map((_, i) => segments.slice(0, i + 1).join(path.sep))]
}

/** A nav entry: where it goes and what it says. */
const item = (page) => ({ url: page.metadata.prettyURL, label: page.metadata.breadcrumb })

/**
 * The aside tree: top-level pages with no date, each with the pages of
 * the folder it names beneath it, recursively; the home page first.
 * @param {any[]} pages
 */
function asideTree(pages) {
  const undated = pages.filter(page => page.path?.endsWith(".html") && !page.metadata.date)
  const home = undated.find(page => page.path === "index.html" && page.dir === "")

  // Indexed by folder url once: finding each node's children by filtering
  // the whole list was O(N²), and the enumerator runs every pass.
  const byFolder = new Map()
  for (const page of undated) {
    if (page.path === "index.html") continue
    const url = "/" + page.dir.split(path.sep).join("/")
    if (!byFolder.has(url)) byFolder.set(url, [])
    byFolder.get(url).push(page)
  }
  // A page with more than MAX_SIBLINGS siblings is left out, and so are
  // its siblings: the folder's own entry stays, and its pages are a
  // listing's job, not a menu's. Per Sam: "exclude pages with 19
  // siblings or more".
  const children = (parent) => {
    const pages = byFolder.get(parent.metadata.prettyURL) ?? []
    return pages.length - 1 > MAX_SIBLINGS ? [] : pages.map(node)
  }

  function node(page) {
    const below = children(page)
    // The aside links the file, not the pretty url - kept as it was
    // (see the note in the commit); the home entry is the bare path.
    return { url: "/" + page.path, label: page.metadata.breadcrumb, ...(below.length ? { children: below } : {}) }
  }

  const top = undated
    .filter(page => page.dir === "" && page.path !== "index.html" && page.path !== "404.html" && page.path !== "tags.html"
      && isOn(page.metadata.global_menu_item) && isOn(page.metadata.html_file))
    .map(node)

  return [...(home ? [{ url: home.path, label: home.metadata.breadcrumb }] : []), ...top]
}

/**
 * Who links to whom, from every page's recorded `links` (see
 * plugins/markdown/links.js for the three spellings: a source path, a
 * pretty url, a `[[Name]]`). Returns, per linked page, its linkers
 * sorted by path. A name two pages share links both - the ambiguity
 * the author wrote. The reverse index used to be a filtered listing
 * per page: a full-table query with json_each per page, and a `links`
 * change anywhere restaled every page.
 * @param {any[]} pages - the linkers: what a listing shows
 * @param {any[]} [linkable] - what can be linked to: every page, hidden
 *   ones included (a secret page gets its backlinks; it just never
 *   appears as a linker)
 * @returns {Map<string, any[]>} target path -> linkers
 */
function backlinkIndex(pages, linkable = pages) {
  const bySource = new Map()
  const byURL = new Map()
  const byLabel = new Map()
  for (const page of linkable) {
    if (page.source) bySource.set(page.source, page)
    if (page.metadata.prettyURL) byURL.set(page.metadata.prettyURL, page)
    if (page.metadata.inferred_label) {
      const key = `[[${page.metadata.inferred_label}]]`
      if (!byLabel.has(key)) byLabel.set(key, [])
      byLabel.get(key).push(page)
    }
  }

  const linkers = new Map()
  const add = (linked, linker) => {
    if (!linked || linked.path === linker.path) return
    if (!linkers.has(linked.path)) linkers.set(linked.path, new Map())
    linkers.get(linked.path).set(linker.path, linker)
  }
  for (const linker of pages) {
    for (const link of linker.metadata.links ?? []) {
      if (typeof link !== "string") continue
      add(bySource.get(link), linker)
      add(byURL.get(link), linker)
      for (const linked of byLabel.get(link) ?? []) add(linked, linker)
    }
  }

  return new Map([...linkers].map(([target, map]) => [target, [...map.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)]))
}

/**
 * Every partial the site needs this pass, as stubs. One untracked
 * listing; the enumerator runs every pass by contract.
 * @param {any} api - the enumerator's api
 */
function createPartialStubs(api) {
  const pages = listPages(api, { folder: "", recursive: true })
  const linkable = api.targets({ folder: "", recursive: true }).filter(page => page.write !== false && page.extension === ".html")

  const backlinks = [...backlinkIndex(pages, linkable)].map(([target, linkers]) => ({
    path: backlinksPartialPath(target),
    params: { pages: linkers.map(page => ({ url: page.metadata.prettyURL, title: page.metadata.title || page.metadata.prettyURL })) }
  }))

  const lists = new Map()
  for (const page of pages) {
    if (!inHeaderNav(page)) continue
    if (!lists.has(page.dir)) lists.set(page.dir, [])
    lists.get(page.dir).push(page)
  }
  for (const list of lists.values()) list.sort(byBreadcrumb)

  // A nav partial for every folder any page lives in, and every ancestor
  // of it - a folder of dated posts still shows its ancestors' lists.
  const folders = new Set([""])
  for (const page of pages) for (const folder of chain(page.dir)) folders.add(folder)

  // The project's stylesheets by folder: a .css the author wrote (has a
  // source, is not one vowel generates), with the hash its read recorded.
  const sheets = new Map()
  for (const sheet of api.targets({ folder: "", recursive: true })) {
    if (!sheet.source || sheet.extension !== ".css" || isVowelStylesheet(sheet.path)) continue
    if (!sheets.has(sheet.dir)) sheets.set(sheet.dir, [])
    sheets.get(sheet.dir).push({ path: sheet.path, hash: sheet.metadata?.hash ?? "" })
  }
  for (const list of sheets.values()) list.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)

  const navs = [...folders].sort().map(folder => ({
    path: navPartialPath(folder),
    params: {
      levels: chain(folder).map(level => (lists.get(level) ?? []).map(item)),
      sheets: chain(folder).flatMap(level => sheets.get(level) ?? [])
    }
  }))

  return [...navs, { path: ASIDE_PARTIAL, params: { items: asideTree(pages) } }, ...backlinks]
}

/** @type {import("votive").ProcessorExpand} */
function expandPartial({ params }) {
  return { text: JSON.stringify(params) }
}

/** The header nav: one <ul> per level that has entries, root first. */
function renderNav({ levels }) {
  return h("nav", levels
    .filter(level => level.length)
    .map(level => h("ul", level.map(({ url, label }) => h("li", h("a", { href: url }, label)))))
  )
}

/** The aside tree. */
function renderAside({ items }) {
  const li = ({ url, label, children }) => children
    ? h("li", [h("a", { href: url }, label), h("ul", children.map(li))])
    : h("li", h("a", { href: url }, label))
  return h("nav", h("ul", items.map(li)))
}

/** "Linked from", outside section#content: it is generated, and the editor must not see it. */
function renderBacklinks({ pages }) {
  return h("section#backlinks", [
    h("h2", "Linked from"),
    h("ul", pages.map(({ url, title }) => h("li", h("a", { href: url }, title))))
  ])
}

/**
 * A partial's source is the JSON its stub was expanded to; the hast is
 * rendered here and stored, so a page never renders it again. Which
 * renderer is the path's business.
 * @type {import("votive").ProcessorRead}
 */
function readPartial(source) {
  const data = JSON.parse(source.text || "{}")
  const kind = source.path.split(path.sep)[1]?.replace(/\.partial$/, "")
  const render = kind === "aside" ? renderAside : kind === "backlinks" ? renderBacklinks : renderNav
  // A nav partial also carries its chain's stylesheets, as data: the
  // page builds the <link>s, since the theme's sheets come first.
  return { metadata: { hast: render(data), ...(data.sheets ? { sheets: data.sheets } : {}) }, write: false }
}

/**
 * The page's copy of a nav, with the current page marked. A copy: the
 * tracked read hands back a fresh parse, but a rule that relies on that
 * would be fragile, and the walk mutates.
 * @param {any} hast
 * @param {string} url - the page's prettyURL
 */
function withCurrent(hast, url) {
  const copy = structuredClone(hast)
  const walk = (node) => {
    if (node.type === "element" && node.tagName === "a" && node.properties?.href === url) node.properties.ariaCurrent = "page"
    node.children?.forEach(walk)
  }
  walk(copy)
  return copy
}

/** @type {import("votive").VotiveProcessor} */
const partialsProcessor = {
  extensions: [".partial"],
  format: "text",
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: readPartial,
  // Virtual: nothing lands on disk, and returning nothing marks it fresh.
  writeFile: () => undefined
}

export { ASIDE_PARTIAL, navPartialPath, backlinksPartialPath, createPartialStubs, expandPartial, withCurrent, partialsProcessor, inHeaderNav, asideTree, backlinkIndex }
