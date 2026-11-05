import path from "node:path"
import { fromHtml } from 'hast-util-from-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { highlightMarkFromMarkdown } from "mdast-util-highlight-mark"
import { highlightMark } from "micromark-extension-highlight-mark"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmFootnote } from "micromark-extension-gfm-footnote"
import { gfmFootnoteFromMarkdown } from "mdast-util-gfm-footnote"
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { normalizeHeadingLevels } from './metadata.js'
import { readFileSync } from "fs"
import { createHashtagPage, labelFromName, showPages, sourceLocation } from "./../../utils.js"
import { frontmatterPoints } from "./frontmatter.js"
import { toHast, defaultHandlers } from 'mdast-util-to-hast'
import { toString as hastToString } from 'hast-util-to-string'
import getMetadata, { imageFromPage, reservedProperties } from "./metadata.js"
import { isSecretPath, secretRouter, displayPath } from "./../../secretPaths.js"
import { collectLinks } from "./links.js"
import { readWalk } from "./readRules.js"
import { h } from "hastscript"
import { mirrorStubs, mirrorWriter } from "./mirror.js"

import { styleText } from "node:util"

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */

/** @type {Votive.ProcessorRead} */
function readFile(source, { api, config }) {
  // Both project-relative (see SourceInput in votive/lib/bundle.js), so
  // filePath answers routing-shaped questions directly: `=== "settings.md"`
  // means the project's root settings file, and pathInfo.dir is a folder
  // within the site rather than somewhere on this machine.
  const { path: filePath, target: targetPath, text: string } = source

  const mdast = fromMarkdown(string, {
    // Micromark extensions
    extensions: [
      frontmatter(),
      gfmFootnote(),
      gfmStrikethrough(),
      gfmTable(),
      highlightMark()
    ],
    mdastExtensions: [
      frontmatterFromMarkdown(),
      gfmFootnoteFromMarkdown(),
      gfmStrikethroughFromMarkdown(),
      gfmTableFromMarkdown(),
      highlightMarkFromMarkdown
    ]
  })

  normalizeHeadingLevels(mdast)
  const pathInfo = path.parse(filePath)

  const metadata = getMetadata(mdast, filePath, targetPath, message => config.log?.("error", message))

  if (!metadata.image) {
    const firstImageParagraph = mdast.children.find(child => child.children && child.children[0].type === "image")
    if (firstImageParagraph) {
      // A card shows it from another folder's page, so from the root.
      const folder = path.dirname(targetPath ?? filePath).replace(/^\.$/, "")
      metadata.first_image = imageFromPage(firstImageParagraph.children[0].url, folder)
    }
  }


  // `status` (frontmatter.js). A draft is not a page at all.
  const status = metadata.fm_status ?? "published"
  if (status === "draft") return

  // A deleted page is not written, and carries nothing a listing, a tag
  // page, a backlink or a wikilink could find it by. It exists only so
  // `atproto-publish` can delete the record it used to have: its
  // lexicon, and the url its record key is derived from (rkey.js).
  if (status === "deleted") {
    const kept = {
      fm_status: status,
      prettyURL: metadata.prettyURL,
      ...("fm_atproto_lexicon" in metadata ? { fm_atproto_lexicon: metadata.fm_atproto_lexicon } : {})
    }
    return { data: "", write: false, metadata: kept }
  }

  // Secrecy is a property of the *path* now: a segment containing "##"
  // is hashed by the config-level router cascade, so the page is only
  // ever published at an unguessable URL (see secretPaths.js). The read's
  // whole remaining job is to say so, because `targetPath` above is
  // already the hashed one and nothing downstream could tell.
  //
  // This replaces `secret_key` frontmatter, which hashed one page at a
  // time, could not cover a folder, left a virtual target at the public
  // path, and had to be hidden from its own rendering.
  // `status: hidden` is the same promise made on purpose: written, never
  // listed. So is the site's 404 page, generated or the author's own: it
  // is served for a missing url, and no listing, sitemap, feed or
  // AT Protocol record should name it.
  if (isSecretPath(filePath) || status === "hidden" || filePath === "404.md") {
    metadata.hidden = true
    metadata.local_nav_item ??= false
    metadata.global_nav_item ??= false
    metadata.sitemap_item ??= false
    metadata.rss_item ??= false
  }


  // One walk: hashtags become links and are recorded, and every explicit
  // link is recorded for backlinks. See readRules.js. Frontmatter links
  // are not in the tree; collectLinks adds them from metadata.
  const walked = { filePath, tags: [], links: [] }
  readWalk(mdast, walked)

  // One tag list: `tags:` in the frontmatter and #hashtags in the text,
  // frontmatter first, each once. A frontmatter tag is a hashtag in every
  // way that matters - it gets a tag page and matches `?tag=`. A leading
  // "#" there is the author's habit, not part of the name.
  const declaredTags = (metadata.fm_tags ?? [])
    .map(tag => String(tag).trim().replace(/^#/, ""))
    .filter(Boolean)
  const tags = [...new Set([...declaredTags, ...walked.tags])]
  if (tags.length) metadata.tags = tags


  // sitemap.xml and feed.xml are stubs on the xml processor now. They
  // were created here because settings.md is where the domain is
  // declared, which meant a page read decided whether two unrelated
  // targets existed - and each write then had to un-create itself when
  // the domain went away.


  const hast = toHast(mdast, {
    // A table in a <figure>: the figure scrolls sideways when the table
    // is too wide, so the table itself can be a real table at full width
    // (a table that scrolls has to be display: block, which sizes its
    // columns to their content), and a caption has somewhere to go.
    handlers: {
      table: (state, node) => h("figure", [defaultHandlers.table(state, node)])
    },
    // `state.all(node)` converts the children to hast; handing over
    // `node.children` gives the HTML compiler raw *mdast* instead. Plain
    // text survives that by coincidence - mdast and hast spell a text
    // node identically - so it only shows up when a marked-up date or
    // highlight contains anything else: `**March 4, 2026**` threw
    // "Cannot compile unknown node `strong`", and a link, emphasis or
    // inline code in the same position threw on their own types.
    // Each element keeps its node's position, as the built-in handlers'
    // do, so a warning at write names the line (an unresolved wikilink).
    unknownHandler: (state, node) => {
      const positioned = (element) => {
        state.patch(node, element)
        return element
      }
      if (node.type === "highlight") return positioned(h("mark", state.all(node)))
      if (node.type === "time") return positioned(h("time", { datetime: node.datetime }, state.all(node)))
      // Parsed at read, resolved at write (writeRules.js): the element
      // carries what the write needs, and what the editor needs to put
      // the directive back.
      if (node.type === "wikilink") return positioned(h("a.wikilink", { "data-note": node.name, "data-section": node.section }, state.all(node)))
      if (node.type === "icon") return positioned(h("img.icon", { "data-icon": node.name, alt: node.name.split("/").at(-1) }))
    }
  })

  // The page carries its own source. It is what the in-page editor saves
  // from - frontmatter from the source, body from the editor - and what
  // the settings panel edits: settings.md contributes its whole metadata
  // as settings, so this key becomes the `markdown` setting at its
  // folder, and the panel reads the root slot. Both used to go through
  // an endpoint (and settings.md was emitted as a target so the panel
  // could GET it - which the deploy then had to strip). Neither reaches
  // the published site: the preview hook puts it into the page, and only
  // there.
  metadata.markdown = string

  // The pages this one links to, explicitly - what a backlinks section
  // on those pages is built from. See links.js for what counts.
  metadata.links = collectLinks(walked.links, metadata, filePath)

  const targetMetadata = { ...metadata, hastAbstract: hast }

  // No second target for a secret page, and no virtual shadow at the
  // public path. Routing already put the page where it belongs, so there
  // is exactly one target - which is the whole point of one source, one
  // target.


  return {
    // `data` is the target's content - the markdown the page is made
    // from. The parsed tree rides alongside as a metadata convention;
    // a consumer unsure of its structure parses `data` instead.
    data: string,
    write: metadata.html_file ?? true,
    metadata: withDeclaredTypes({ ...targetMetadata, hastAbstract: hast }),
    settings: pathInfo.base === "settings.md" ? settingsContribution(metadata, filePath, config?.log, mdast.children.find(child => child.type === "yaml")) : undefined
  }
}

/**
 * The labels vowel declares a type for, wrapped as `{ $type, $value }`
 * for votive to unwrap at the write (see votive's ReadHookResult). The
 * value stored and read back is unchanged - an ISO string, which sorts
 * and compares lexically as a date does - and `target.types.date` says
 * "date" for a consumer that wants to treat it as one: the editor's
 * field, a lexicon mapping. Only at the return, so nothing in this
 * file sees the wrapper either.
 * @param {Record<string, any>} metadata
 */
function withDeclaredTypes(metadata) {
  const declared = { ...metadata }
  for (const label of ["date", "fm_date", "inferred_date"]) {
    if (declared[label] === undefined) continue
    declared[label] = { $type: "date", $value: declared[label] }
  }
  return declared
}

/**
 * What a settings.md contributes to its folder: what the author declared,
 * and nothing inferred. It used to contribute its whole metadata, so a
 * settings.md with no `title:` set the site title to "Settings" - the
 * label inferred from its own filename - and its first paragraph became
 * the description. The site's name is `name:` (read as `fm_name`); a
 * `title:` here is an old spelling and is warned about, since a page
 * has a title and a site has a name. `slogan:` is warned about too: it
 * is a page's, and the homepage's is the one a site shows on its front
 * door. `markdown` is the source, which the settings panel edits.
 * @param {Record<string, any>} metadata
 * @param {string} filePath
 * @param {(level: string, message: string) => void} [log]
 * @param {object} [yamlNode] - its frontmatter, for the warnings' lines
 */
function settingsContribution(metadata, filePath, log, yamlNode) {
  // Each warning names the key's line. Found only when there is one to
  // give, since it parses the block again.
  const at = (key) => sourceLocation(filePath, yamlNode ? frontmatterPoints(yamlNode)[key] : undefined)
  if (metadata.fm_title !== undefined && metadata.fm_name === undefined) {
    log?.("warn", `${at("title")}: \`title:\` in a settings file does nothing - the site's name is \`name:\``)
  }
  if (metadata.fm_slogan !== undefined) {
    log?.("warn", `${at("slogan")}: \`slogan:\` in a settings file does nothing - a slogan belongs to a page, e.g. home.md`)
  }
  // Mirrors are declared by an enumerator, which sees the root's
  // settings only.
  if (metadata.markdown_mirror !== undefined && filePath !== "settings.md") {
    log?.("warn", `${at("markdown_mirror")}: \`markdown_mirror:\` works only in the root settings.md or in a page's frontmatter`)
  }
  const declared = Object.entries(metadata)
    .filter(([key]) => key.startsWith("fm_") || reservedProperties.includes(key))
  return {
    ...Object.fromEntries(declared),
    frontmatter_keys: metadata.frontmatter_keys,
    markdown: metadata.markdown
  }
}




/** @type {Votive.ProcessorReadFolder} */
/**
 * The sources vowel synthesizes rather than finds on disk.
 *
 * Runs on every pass with an untracked, read-only api. Each entry is a
 * path plus the params its expansion needs; votive diffs the params and
 * calls `expand` only for what changed. A real file at any of these paths
 * shadows the stub, which is how an author overrides the default 404 or
 * writes their own tags index.
 *
 * @type {Votive.ProcessorStubs}
 */
function createStubs({ api }) {
  // Every tag any page carries. One indexed query rather than pulling
  // every target back and flattening `tags` in JS on every pass.
  const tags = api.metadataValues("tags")
    .filter(tag => typeof tag === "string" && tag)
    .sort()

  // The homepage. `home.md` is the path vowel's router maps to
  // index.html, so an authored `home.md` shadows this stub outright.
  //
  // An authored `index.md` lands on index.html too - not by any rule,
  // just by its name - and shadowing only matches on the source path,
  // so the stub also has to stand down when some other source already
  // owns index.html. Checking `source` rather than mere existence is
  // what stops it oscillating: when the stub itself made the page, the
  // page is still ours and we keep declaring it.
  const homeTarget = api.target("index.html")
  const homeIsOurs = !homeTarget || homeTarget.source === "home.md"

  const named = [
    ...(homeIsOurs ? [{ path: "home.md" }] : []),
    { path: "404.md" },

    // The tags index exists only while some page is tagged. A site with
    // no hashtags has no Tags page, and deleting the last hashtag takes
    // the page and its file with it.
    ...(tags.length ? [{ path: "tags.md" }] : []),

    // One page per tag. `params` is what expand needs and nothing more.
    ...tags.map(tag => ({ path: path.join("tags", `${tag}.md`), params: { tag } }))
  ]
  const taken = new Set(named.map(stub => stub.path))

  // A section index per folder with a listed page (see folderIndexes),
  // and per secret folder with a page (secretFolderIndexes) - except
  // where a stub above already is that page: `tags.md` is the tags
  // folder's index.
  const indexes = [...folderIndexes(api), ...secretFolderIndexes(api)]
  return [...named, ...indexes.filter(stub => !taken.has(stub.path))]
}

/**
 * One `<folder>.md` per folder that has a listed page, at any depth -
 * the section index, a stub named as the page an author would write
 * for it. It routes to `<folder>.html` by the ordinary rule, so `/blog`
 * is a page, and the breadcrumb and nav (which look up `<folder>.html`)
 * find it with no change.
 *
 * Derived from the targets, since there is no api.folders(): a folder
 * counts when a page *a listing would show* lives in it or below it -
 * a page without a file (`html_file: false`) too, since the index is
 * where its card is.
 * An empty folder and an asset-only folder get no index, and a folder
 * whose last page goes loses its index on that pass - the stub is simply
 * no longer declared. A secret folder's pages are all hidden, so none
 * counts here; secretFolderIndexes gives those folders theirs.
 *
 * An author's own `blog.md` beside `blog/` shadows the stub by path,
 * votive's ordinary rule; the stub stands down when `<folder>.html`
 * already has another source, such as the `tags.md` stub. Checking
 * `source` rather than mere existence is what stops it oscillating, as
 * with home.md above. Neither `index.md` nor `home.md` below the root
 * gets special handling (Sam, Sept 19 and 25): `blog/index.md` and
 * `blog/home.md` are ordinary children of `blog.html`.
 * @param {any} api - the enumerator's untracked api
 */
function folderIndexes(api) {
  const pages = showPages(api, { folder: "", recursive: true })
    .filter(page => page.source && page.dir)

  const folders = new Set()
  for (const page of pages) {
    const segments = page.dir.split(path.sep)
    for (let depth = 1; depth <= segments.length; depth++) {
      folders.add(segments.slice(0, depth).join(path.sep))
    }
  }

  return [...folders].sort().flatMap(folder => {
    const stubPath = `${folder}.md`
    const indexTarget = api.target(`${folder}.html`)
    const ours = !indexTarget || indexTarget.source === stubPath
    return ours ? [{ path: stubPath, params: { folder } }] : []
  })
}

/**
 * One index per secret folder (`members##salt/`) with a written page,
 * and per folder below one. Per Sam: a secret folder should get its
 * index like any other, and without one its breadcrumb had nothing to
 * link to.
 *
 * Built in *source* terms, because a secret folder's published name is
 * a hash. The stub is `members##salt.md`, which routing hashes to
 * `<hash>.html` beside the folder's `<hash>/`, the way `blog.md` sits
 * beside `blog/` - so the breadcrumb's `<folder>.html` lookup finds it.
 * Its listing is a relative glob, the only kind that sees secret pages,
 * and its title is the folder's name without the salt (expandStubs). As
 * a page under a secret segment it is hidden itself.
 *
 * Folders *above* the secret segment get nothing from a secret page:
 * their index would list none of it. A `status: hidden` page doesn't
 * count. An author's own `members##salt.md` shadows the stub by path.
 * @param {any} api - the enumerator's untracked api
 */
function secretFolderIndexes(api) {
  const pages = api.targets({ folder: "", recursive: true, query: { hidden: true } })
    .filter(page => page.write !== false
      && page.extension === ".html"
      && typeof page.source === "string"
      && isSecretPath(page.source)
      && page.metadata.fm_status !== "hidden")

  const folders = new Set(pages.flatMap(page => {
    const segments = page.source.split(path.sep).slice(0, -1)
    const first = segments.findIndex(segment => isSecretPath(segment))
    if (first === -1) return []
    return segments.slice(first).map((_, offset) => segments.slice(0, first + offset + 1).join(path.sep))
  }))

  return [...folders].sort().flatMap(folder => {
    const stubPath = `${folder}.md`
    // vowel's router (config.js): secret segments hashed, then lowercased.
    const routed = secretRouter(stubPath).toLowerCase().replace(/\.md$/, ".html")
    const indexTarget = api.target(routed.split("/").join(path.sep))
    const ours = !indexTarget || indexTarget.source === stubPath
    return ours ? [{ path: stubPath, params: { folder, secret: true } }] : []
  })
}

/**
 * Produces a declared stub's markdown, on demand.
 *
 * Called only when a stub is new or its params changed, and it returns
 * *markdown* - not metadata, not a tree. The ordinary readFile below
 * parses it, so a tag page infers its title from its own `#` heading and
 * gets its prettyURL from routing, exactly like a page an author wrote.
 * That is the point of expanding to source rather than to a target.
 *
 * @type {Votive.ProcessorExpand}
 */
function expandStubs({ path: sourcePath, params }) {
  if (sourcePath === "home.md") {
    // A listing of everything, which is what the folder pass generated.
    return { text: "# Home\n\n//*" }
  }

  if (sourcePath === "404.md") {
    return { text: "# Page not found\n\nSorry, that page does not exist." }
  }

  if (sourcePath === "tags.md") {
    // The glob directive the html plugin expands into a listing.
    return { text: "# Tags\n\n/tags/**" }
  }

  if (params?.tag) {
    return { text: createHashtagPage(params.tag) }
  }

  if (params?.secret) {
    // A secret folder's index: titled by its name without the salt, and
    // listed by a relative glob, resolved against this stub's own source
    // path - the folder beside it - which is how a listing sees the
    // secret pages a published-path glob never does.
    const name = displayPath(params.folder).split(path.sep).at(-1)
    const own = params.folder.split(path.sep).at(-1)
    return { text: `# ${labelFromName(name)}\n\n./${own}/*` }
  }

  if (params?.folder !== undefined) {
    // The folder's name as its title, and a listing of the folder - not
    // recursive: a nested section has an index of its own, and that
    // index is what appears here.
    const name = params.folder.split(path.sep).at(-1)
    const url = "/" + params.folder.split(path.sep).join("/")
    return { text: `# ${labelFromName(name)}\n\n${url}/*` }
  }

  return null
}

/** @type {Votive.Router} */
function router(args) {
  const { name, dir, inRootDir, ext } = args
  if (name.startsWith("$")) return false
  if (dir.find?.(segment => segment.startsWith("$"))) return false

  switch (name) {
    case "settings":
      return false
    // The root's `home.md` is the homepage, index.html. It is the one
    // name with a rule, and only at the root: `blog/home.md` is a page
    // called home, like `blog/index.md`. A folder's index is `blog.md`
    // beside `blog/`.
    case "home":
      if (inRootDir) {
        return {
          dir,
          name: "index",
          ext: ".html"
        }
      }
    // falls through
    default:
      return {
        dir: dir.map(segment => segment.replaceAll(/[^\w\/]/g, "-").replaceAll(/--+/g, "-").toLowerCase()),
        name: name.replaceAll(/[^\w\/]/g, "-").replaceAll(/--+/g, "-").toLowerCase(),
        ext: "html"
      }
  }
}


/** @type {Votive.VotiveProcessor} */
const readMarkdown = {
  extensions: [".md"],
  format: "text",
  router,
  createStubs,
  expandStubs,
  readFile
}



/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [readMarkdown, mirrorStubs, mirrorWriter]
}

export default vowelMarkdownPlugin