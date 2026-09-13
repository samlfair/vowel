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
import { testURL, testHashtags, createHashtagPage, toTitleCase, hashtagRegexSingle } from "./../../utils.js"
import { toHast } from 'mdast-util-to-hast'
import { toString as hastToString } from 'hast-util-to-string'
import { visit } from "unist-util-visit"
import getMetadata from "./metadata.js"
import { h } from "hastscript"
import { hash } from "node:crypto"

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

  // Hashed over the *routed target* path - the page's identity as
  // published, so renaming the source file without changing where it
  // routes leaves the secret URL alone. Project-relative either way, so
  // the URL no longer changes when the project moves.
  const secretFileName = metadata.secret_key && hash("MD5", targetPath + metadata.secret_key)
  const secretFileInfo = secretFileName && router({ name: secretFileName, dir: pathInfo.dir.split(path.sep), ext: ".html" })
  const secretFilePath = secretFileInfo && path.format({ name: secretFileInfo.name, dir: secretFileInfo.dir.join(path.sep), ext: secretFileInfo.ext })
  if(secretFilePath) {
    const secretPrettyFilePath = "/" + secretFilePath.slice(0, -5)
    metadata.prettyURL = secretPrettyFilePath
    metadata.local_menu_item ??= false
    metadata.global_menu_item ??= false
    metadata.sitemap_item ??= false
    metadata.rss_item ??= false
    console.info(`${styleText("dim", "build: ")}: secret file path for ${filePath}: ${secretPrettyFilePath}`)
  }


  visit(mdast, (node, index, parent) => {
    if (node.type === "text" && parent.children.length === 1 && parent.type === "paragraph") {
      const validURL = testURL(node.value)

      // A bare URL paragraph is a link preview; the urls plugin asks for
      // it on the transform side and the html plugin renders it.
      if (validURL) return

      const hashtags = testHashtags(node.value)

      // TODO: Tags should not appear in menus
      // TODO: Make this work when tags are embedded in text

      if (hashtags) {
        function convertTagsToLinks(value) {
          const match = value.match(hashtagRegexSingle)
          if (match) {
            const remainder = value.slice(match[0].length)
            const child = {
              type: "link",
              url: `/tags/${match[3]}`,
              children: [
                {
                  type: "text",
                  value: match[0]
                }
              ]
            }

            return [
              {
                type: "text",
                value: match[1]
              },
              child,
              {
                type: "text",
                value: match[4]
              },

              ...convertTagsToLinks(remainder)
            ]
          }
          return [
            {
              type: "text",
              value: value
            }
          ]
        }

        parent.children = convertTagsToLinks(node.value)

        // The tags index and the per-tag pages are stubs now (see `stubs`
        // below). This hook's only remaining job for a hashtag is to
        // record it on *this* page, which is what the enumerator then
        // reads back through api.distinct("tags"). Every tagged page used
        // to create every tag page it mentioned - the many-producers-per
        // -target shape the whole design exists to remove.
        if (hashtags) {
          if (!metadata.tags) {
            metadata.tags = []
          } else if (!Array.isArray(metadata.tags)) {
            metadata.tags = []
          }

          metadata.tags = []

          hashtags.forEach(hashtag => {
            metadata.tags.push(hashtag)
          })
        }
      }
    }
  })


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
    }
  })

  const targetMetadata = { ...metadata, hastAbstract: hast }

  // A secret page lives only at its hashed path. readFile can't move its
  // own target any more, so it creates the real page as a separate
  // target here and leaves the routed one virtual (write: false below) -
  // nothing lands at the public URL at all. Deliberately not a redirect
  // from the public path: that would hand the secret to anyone who
  // visited it, which is the one thing this feature exists to prevent.
  if (secretFilePath) {
    api.createTarget({
      path: secretFilePath,
      metadata: { ...targetMetadata, hastAbstract: hast },
      // Attributed to the same source file the routed target has, so
      // this behaves exactly as it did when readFile relocated its own
      // target: relative-link resolution and targetBySource() lookups
      // both still find a page with a real source behind it.
      source: filePath
    })
  }

  // settings.md is routed nowhere (router() returns false for it), so
  // its own text is emitted as a target here instead. That is what puts
  // it on the served site, where the settings panel can GET it, edit the
  // frontmatter and POST the result back to votive's write endpoint - a
  // read path without a new endpoint. See writeMarkdown below for what
  // actually writes it.
  if (pathInfo.base === "settings.md") {
    // Mirrors the source path rather than hardcoding the root one: every
    // folder can carry its own settings.md, and they would otherwise all
    // collide on a single target, leaving whichever was read last.
    api.createTarget({
      path: filePath,
      data: string,
      metadata: {}
    })
  }

  return {
    // `data` is the target's content - the markdown the page is made
    // from. The parsed tree rides alongside as a metadata convention;
    // a consumer unsure of its structure parses `data` instead.
    data: string,
    write: secretFilePath ? false : (metadata.html_file ?? true),
    metadata: { ...targetMetadata, hastAbstract: hast },
    settings: pathInfo.base === "settings.md" ? metadata : undefined
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



/** @type {Votive.ProcessorTransform} */
function transformFile(target, context) {
  return {}
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
function stubs({ api }) {
  // Every tag any page carries. One indexed query rather than pulling
  // every target back and flattening `tags` in JS on every pass.
  const tags = api.distinct("tags")
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

    // The tags index exists only while some page is tagged. A site with
    // no hashtags has no Tags page, and deleting the last hashtag takes
    // the page and its file with it.
    ...(tags.length ? [{ path: "tags.md" }] : []),

    // One page per tag. `params` is what expand needs and nothing more.
    ...tags.map(tag => ({ path: `tags/${tag}.md`, params: { tag } }))
  ]
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
function expand({ path: sourcePath, params }) {
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
    case "home":
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
  stubs,
  expand,
  readFile,
  writeFile: writeMarkdown,
  transformFile,
}



/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [readMarkdown]
}

export default vowelMarkdownPlugin