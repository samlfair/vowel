import path from "node:path"
import { h } from "hastscript"
import { listPages } from "../../utils.js"

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
 * lists for every level from the root down to that folder. There is
 * one `partials/aside.partial`, the site tree, the same on every page.
 * `.partial` is an extension nothing else claims, so a project file can
 * never be read as one; the targets are virtual (write: false), which
 * keeps them out of every listing, the sitemap and the feed.
 */

const ASIDE_PARTIAL = path.join("partials", "aside.partial")

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

  const children = (parent) => undated
    .filter(page => "/" + page.dir.split(path.sep).join("/") === parent.metadata.prettyURL && page.path !== "index.html")
    .map(node)

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
 * Every partial the site needs this pass, as stubs. One untracked
 * listing; the enumerator runs every pass by contract.
 * @param {any} api - the enumerator's api
 */
function createPartialStubs(api) {
  const pages = listPages(api, { folder: "", recursive: true })

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

  const navs = [...folders].sort().map(folder => ({
    path: navPartialPath(folder),
    params: { levels: chain(folder).map(level => (lists.get(level) ?? []).map(item)) }
  }))

  return [...navs, { path: ASIDE_PARTIAL, params: { items: asideTree(pages) } }]
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

/**
 * A partial's source is the JSON its stub was expanded to; the hast is
 * rendered here and stored, so a page never renders it again.
 * @type {import("votive").ProcessorRead}
 */
function readPartial(source) {
  const data = JSON.parse(source.text || "{}")
  const hast = source.path.endsWith("aside.partial") ? renderAside(data) : renderNav(data)
  return { metadata: { hast }, write: false }
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

export { ASIDE_PARTIAL, navPartialPath, createPartialStubs, expandPartial, withCurrent, partialsProcessor, inHeaderNav, asideTree }
