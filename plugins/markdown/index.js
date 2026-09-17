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
import { createHashtagPage, toTitleCase, listPages } from "./../../utils.js"
import { toHast } from 'mdast-util-to-hast'
import { toString as hastToString } from 'hast-util-to-string'
import getMetadata, { reservedProperties } from "./metadata.js"
import { isSecretPath } from "./../../secretPaths.js"
import { collectLinks } from "./links.js"
import { readWalk } from "./readRules.js"
import { h } from "hastscript"

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

  const metadata = getMetadata(mdast, filePath, targetPath)

  if (!metadata.image) {
    const firstImageParagraph = mdast.children.find(child => child.children && child.children[0].type === "image")
    if (firstImageParagraph) {
      metadata.first_image = firstImageParagraph.children[0].url
    }
  }


  if (metadata.fm_published === false) return

  // Secrecy is a property of the *path* now: a segment beginning with "-"
  // is hashed by the config-level router cascade, so the page is only
  // ever published at an unguessable URL (see secretPaths.js). The read's
  // whole remaining job is to say so, because `targetPath` above is
  // already the hashed one and nothing downstream could tell.
  //
  // This replaces `secret_key` frontmatter, which hashed one page at a
  // time, could not cover a folder, left a virtual target at the public
  // path, and had to be hidden from its own rendering.
  if (isSecretPath(filePath)) {
    metadata.hidden = true
    metadata.local_menu_item ??= false
    metadata.global_menu_item ??= false
    metadata.sitemap_item ??= false
    metadata.rss_item ??= false
  }


  // One walk: hashtags become links and are recorded, and every explicit
  // link is recorded for backlinks. See readRules.js. Frontmatter links
  // are not in the tree; collectLinks adds them from metadata.
  const walked = { filePath, tags: [], links: [] }
  readWalk(mdast, walked)
  if (walked.tags.length) metadata.tags = walked.tags


  // sitemap.xml and feed.xml are stubs on the xml processor now. They
  // were created here because settings.md is where the domain is
  // declared, which meant a page read decided whether two unrelated
  // targets existed - and each write then had to un-create itself when
  // the domain went away.


  const hast = toHast(mdast, {
    // `state.all(node)` converts the children to hast; handing over
    // `node.children` gives the HTML compiler raw *mdast* instead. Plain
    // text survives that by coincidence - mdast and hast spell a text
    // node identically - so it only shows up when a marked-up date or
    // highlight contains anything else: `**March 4, 2026**` threw
    // "Cannot compile unknown node `strong`", and a link, emphasis or
    // inline code in the same position threw on their own types.
    unknownHandler: (state, node) => {
      if (node.type === "highlight") return h("mark", state.all(node))
      if (node.type === "time") return h("time", { datetime: node.datetime }, state.all(node))
      // Parsed at read, resolved at write (writeRules.js): the element
      // carries what the write needs, and what the editor needs to put
      // the directive back.
      if (node.type === "wikilink") return h("a.wikilink", { "data-note": node.name, "data-section": node.section }, state.all(node))
      if (node.type === "icon") return h("img.icon", { "data-icon": node.name, alt: node.name.split("/").at(-1) })
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
    settings: pathInfo.base === "settings.md" ? settingsContribution(metadata) : undefined
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
 * the description. `title` is the one derived key kept, because every
 * reader asks for the unprefixed label; it is the declared `title:` or
 * nothing. `markdown` is the source, which the settings panel edits.
 * @param {Record<string, any>} metadata
 */
function settingsContribution(metadata) {
  const declared = Object.entries(metadata)
    .filter(([key]) => key.startsWith("fm_") || reservedProperties.includes(key))
  return {
    ...Object.fromEntries(declared),
    ...(metadata.fm_title ? { title: metadata.fm_title } : {}),
    frontmatter_keys: metadata.frontmatter_keys,
    markdown: metadata.markdown
  }
}

/**
 * The only markdown target vowel produces is settings.md itself (every
 * other .md file is routed to .html), so this passes its source text
 * through untouched - the panel edits the real file, not a rendering of
 * it.
 * @type {Votive.ProcessorWrite}
 */
function writeMarkdown(target) {
  return {
    data: target.data,
    encoding: "utf-8"
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
  // `index.md` routes there too, though, and shadowing only matches on
  // the source path - so the stub also has to stand down when some other
  // source already owns index.html. Checking `source` rather than mere
  // existence is what stops it oscillating: when the stub itself made the
  // page, the page is still ours and we keep declaring it.
  const homeTarget = api.target("index.html")
  const homeIsOurs = !homeTarget || homeTarget.source === "home.md"

  return [
    ...(homeIsOurs ? [{ path: "home.md" }] : []),
    { path: "404.md" },

    // A section index per folder with a listed page (see folderIndexes).
    ...folderIndexes(api),

    // The tags index exists only while some page is tagged. A site with
    // no hashtags has no Tags page, and deleting the last hashtag takes
    // the page and its file with it.
    ...(tags.length ? [{ path: "tags.md" }] : []),

    // One page per tag. `params` is what expand needs and nothing more.
    ...tags.map(tag => ({ path: path.join("tags", `${tag}.md`), params: { tag } }))
  ]
}

/**
 * One `<folder>/index.md` per folder that has a listed page, at any
 * depth - the section index the folder pass used to create as an
 * alias page. It routes to `<folder>.html` like `<folder>/home.md`
 * does, so `/blog` is a page, and the breadcrumb and nav (which look
 * up `<folder>.html`) find it with no change.
 *
 * Derived from the targets, since there is no api.folders(): a folder
 * counts when a page *listPages would show* lives in it or below it.
 * An empty folder, an asset-only folder and a secret folder (every page
 * hidden) get no index, and a folder whose last page goes loses its
 * index on that pass - the stub is simply no longer declared.
 *
 * The stub stands down when `<folder>.html` already has another source:
 * an author's `<folder>/home.md`, or the `tags.md` stub. An author's
 * own `<folder>/index.md` shadows it by path, votive's ordinary rule.
 * Checking `source` rather than mere existence is what stops it
 * oscillating, as with home.md above.
 * @param {any} api - the enumerator's untracked api
 */
function folderIndexes(api) {
  const pages = listPages(api, { folder: "", recursive: true })
    .filter(page => page.source && page.dir)

  const folders = new Set()
  for (const page of pages) {
    const segments = page.dir.split(path.sep)
    for (let depth = 1; depth <= segments.length; depth++) {
      folders.add(segments.slice(0, depth).join(path.sep))
    }
  }

  return [...folders].sort().flatMap(folder => {
    const stubPath = path.join(folder, "index.md")
    const indexTarget = api.target(`${folder}.html`)
    const ours = !indexTarget || indexTarget.source === stubPath
    return ours ? [{ path: stubPath, params: { folder } }] : []
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

  if (params?.folder !== undefined) {
    // The folder's name as its title, and a listing of the folder - not
    // recursive: a nested section has an index of its own, and that
    // index is what appears here.
    const name = params.folder.split(path.sep).at(-1)
    const url = "/" + params.folder.split(path.sep).join("/")
    return { text: `# ${toTitleCase(name)}\n\n${url}/*` }
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
    // `home.md` and `index.md` are two spellings of one thing: the
    // section index. At the root both land on index.html; in a folder
    // both land on `<folder>.html`.
    case "home":
    case "index":
      if (inRootDir) {
        return {
          dir,
          name: "index",
          ext: ".html"
        }
      }
      return {
        dir: dir.slice(0, -1).map(segment => segment.replaceAll(/[^\w\/]/g, "-").replaceAll(/--+/g, "-").toLowerCase()),
        name: dir.at(-1).toLowerCase(),
        ext: ".html"
      }
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
  readFile,
  writeFile: writeMarkdown
}



/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [readMarkdown]
}

export default vowelMarkdownPlugin