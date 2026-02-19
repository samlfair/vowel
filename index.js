import voot from "voot"
import { h } from 'hastscript'
import fs from "fs/promises"
import { readFileSync } from "fs"
import { rehype } from "rehype"
import { find } from 'unist-util-find'
import { toHast } from 'mdast-util-to-hast'
import { fromHtml } from 'hast-util-from-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmFootnoteFromMarkdown } from "mdast-util-gfm-footnote"
import { visit } from "unist-util-visit"
import { gfmFootnote } from "micromark-extension-gfm-footnote"
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item' // TODO: Add
import { gfmTaskListItemFromMarkdown } from 'mdast-util-gfm-task-list-item' // TODO: Add
import { normalizeHeadings } from 'mdast-normalize-headings'
import { toString as mdastToString } from 'mdast-util-to-string'
import { toString as hastToString } from 'hast-util-to-string'
import yaml from 'yaml'
import extractDate from "./extractDate.js"
import { testURL } from "./utils.js"
import path from "node:path"
import { styleText } from "node:util"

const VOWEL_DIR = import.meta.dirname


/** @import {Runner, ReadPath, VotiveConfig, VotivePlugin, VotiveProcessor, ReadText, ReadAbstract, ReadFolder, ProcessorWrite, Router} from "votive" */

/** @type {VotiveProcessor} */
const cssWriter = {
  syntax: "css",
  write: writeCSS
}

/** @type {VotiveProcessor} */
const jpegLoader = {
  syntax: "jpeg",
  filter: {
    extensions: [".jpeg", ".jpg"]
  },
  read: {
    path: readImagePath,
  },
  write: writeImage
}


/** @type {ProcessorWrite} */
function writeCSS(destination, database, config) {
  return {
    data: destination.abstract.css,
    encoding: "utf-8"
  }
}

function readURL(data) {
  const hast = fromHtml(data)
  const metadata = {}

  visit(hast, (node) => {
    if (node.tagName === "meta") {
      if (node.properties && node.properties.property) {
        metadata[node.properties.property] = node.properties.content
      }
    } else if (node.tagName === "title") {
      metadata.title = hastToString(node)
    } else if (node.tagName === "link") {
      if (node.properties?.rel?.includes("me")) {
        metadata.me = node.properties.href
      } else if (node.properties?.rel?.includes("webmention")) {
        metadata.webmention = node.properties.href
      } else if (node.properties?.rel?.includes("icon")) {
        metadata.icon = node.properties.href
      }
    }
  })

  return metadata
}

/** @type {VotiveProcessor} */
const markdownReader = {
  syntax: "mdast",
  filter: { extensions: [".md"] },
  read: {
    text: readMarkdown,
    url: readURL,
    abstract: readAbstract,
    folder: readFolder
  },
  write: writeHTML
}


async function removeCache() {
  try {
    await fs.rm("./.votive.db")
    console.info(styleText("yellow", "Cache cleared"))
  } catch (e) {
    console.info(styleText("yellow", "No database cache found"))
  }
}

async function removeDB() {
  try {
    await fs.rmdir("./output")
    console.info(styleText("yellow", "Output cleared"))
  } catch (e) {
    console.info(styleText("yellow", "No output cache found"))
  }
}

await removeCache()
await removeDB()

/** @type {ReadText} */
function readMarkdown(string, filePath, destinationPath, database, config) {
  const mdast = fromMarkdown(string, {
    // Micromark extensions
    extensions: [
      frontmatter(),
      gfmFootnote(),
      gfmStrikethrough(),
      gfmTable()
    ],
    mdastExtensions: [
      frontmatterFromMarkdown(),
      gfmFootnoteFromMarkdown(),
      gfmStrikethroughFromMarkdown(),
      gfmTableFromMarkdown()
    ]
  })

  normalizeHeadings(mdast)
  const pathInfo = path.parse(filePath)
  const metadata = getMetadata(mdast)
  metadata.inferred_label = pathInfo.name
  const destinationInfo = path.parse(destinationPath)
  metadata.prettyURL = (new URL(`${destinationInfo.dir}/${destinationInfo.name}`, "thismessage:/")).pathname
  const jobs = []

  selectMetadata(metadata)

  if (pathInfo.base === "settings.md") {
    for (const key in metadata) {
      database.setSetting(
        pathInfo.dir,
        key,
        metadata[key],
        filePath
      )
    }
  }

  visit(mdast, (node, index, parent) => {
    if (node.type === "text" && parent.children.length === 1 && parent.type === "paragraph") {
      const validURL = testURL(node.value)
      if (validURL) {

        jobs.push({
          data: node.value,
          runner: "text",
          destination: destinationPath
        })
      }
    }
  })

  return { abstract: mdast, metadata, jobs }
}

/** @param {ReturnType<getMetadata>} metadata */
function selectMetadata(metadata) {
  const date =
    metadata.fm_date
    || metadata.inferred_date

  if (date) {
    metadata.date = date
  }

  const title =
    metadata.fm_title
    || metadata.inferred_title
    || metadata.inferred_label

  if (title) {
    metadata.title = title
  }

  const breadcrumb =
    metadata.fm_breadcrumb
    || metadata.title
    || metadata.inferred_label

  if (breadcrumb) {
    metadata.breadcrumb = breadcrumb
  }

  const description =
    metadata.fm_description
    || metadata.inferred_description

  if (description) {
    metadata.description = description
  }

  const image =
    metadata.fm_image
    || metadata.inferred_image

  if (image) {
    metadata.image = image
  }
}


/**
 * @param {string} text
 */
function truncateText(text) {
  const match = text.match(/^(?<desc>((\b.+?){28})\S)\s(?<etc>.+)$/)
  if (!match) {
    return text
  } else if (match.groups.etc) {
    return match.groups.desc + "..."
  } else {
    return match.groups.desc
  }
}

/** @param {object} tree */
function getMetadata(tree) {
  const metadata = {}

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i]
    const text = mdastToString(child)
    switch (child.type) {
      case "paragraph":
        if (child.children.length !== 1) {
          if (!metadata.fm_description && !metadata.inferred_description) {
            const description = truncateText(text)
            metadata.inferred_description = description
          }
          i = Infinity
          break
        } else if (child.children[0].type === "image") {
          metadata.inferred_image = child.children[0].url
          metadata.inferred_alt_text = child.children[0].alt
          break
        } else if (testURL(text)) {
          const url = new URL(text)
          if (text.match(/\.(jpeg|jpg|png)$/)) {
            metadata.inferred_image = url
            break
          } else {
            metadata.inferred_link = url
            break
          }
        } else {
          const inferred_date = extractDate(mdastToString(child))
          if (inferred_date) metadata.inferred_date = inferred_date
          else i = Infinity
          break
        }
      case "heading":
        if (child.depth === 1) {
          metadata.inferred_title = mdastToString(child)
        }
        break
      case "yaml":
        const frontmatter = yaml.parse(child.value)
        for (const key in frontmatter) {
          metadata["fm_" + key] = frontmatter[key]
        }
        break
      default:
        i = Infinity
        break
    }
  }

  // TODO: Extract links!
  // TODO: Extract backlinks
  return metadata

}

/** @type {ReadAbstract} */
function readAbstract(abstract, database, config) {
  const jobs = []
  return { abstract, jobs }
}

/** @type {ReadFolder} */
function readFolder(folder, database, config, isRoot) {
  const folderInfo = path.parse(folder)

  const indexPath = path.format({
    dir: path.join(folderInfo.dir, folderInfo.name),
    name: "index",
    ext: ".html"
  })

  const aliasPath = path.format({
    dir: path.join(folderInfo.dir),
    name: folderInfo.name,
    ext: ".html"
  })

  const indexFile = database.getDestinationIndependently(indexPath)
  const aliasFile = database.getDestinationIndependently(aliasPath)

  if (!indexFile && !aliasFile) {
    database.createOrUpdateDestination({
      metadata: {
        title: folderInfo.name
      },
      path: aliasPath,
      abstract: {},
      syntax: "mdast"
    })
  }


  if (isRoot) {
    // TODO: Create theme job
    const settings = database.getSettings(config.sourceFolder)
    if (!settings.theme || settings.theme[0] === "default") {
      database.setSetting(folder, "theme", "default")
      // TODO: Save theme file (reset, typography, default)

      const resetStylesPath = path.join(VOWEL_DIR, "stylesheets", "ResetStyles.css")
      const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
      const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")

      const resetStyles = readFileSync(resetStylesPath, "utf-8")
      const typeStyles = readFileSync(typeStylesPath, "utf-8")
      const defaultStyles = readFileSync(defaultStylesPath, "utf-8")

      database.createOrUpdateDestination({
        path: "reset.css",
        abstract: { css: resetStyles },
        metadata: {},
        syntax: "css"
      })

      database.createOrUpdateDestination({
        path: "typography.css",
        abstract: { css: typeStyles },
        metadata: {},
        syntax: "css"
      })

      database.createOrUpdateDestination({
        path: "default.css",
        abstract: { css: defaultStyles },
        metadata: {},
        syntax: "css"
      })
    }
    // TODO: Create robots
    // TODO: Create RSS
    // TODO: Create sitemap
  }



  return {
    jobs: [],
    destinations: []
  }
}

/** @type {ProcessorWrite} */
function writeHTML(destination, database, config) {
  const settings = database.getSettings(destination.dir)
  const { abstract, metadata, ...rest } = destination

  /** @param {string} filePath */
  function listFolders(filePath) {
    if (!filePath) return []

    const pathInfo = path.parse(filePath)
    const dir = pathInfo.dir && pathInfo.dir + path.sep

    return [filePath, ...listFolders(
      dir
    )]
  }

  const ancestorFolders = listFolders(rest.dir)

  const family = database.getDestinations({
    filter: [
      {
        property: "dir",
        operator: "in",
        value: ancestorFolders
      }
    ]
  }, destination.path)

  const treeStyleSheets = []

  !settings.theme || settings.theme.includes("default") && treeStyleSheets.push(
    h('link', {
      rel: "stylesheet",
      href: "/default.css"
    }),
    h('link', {
      rel: "stylesheet",
      href: "/typography.css"
    }),
    h('link', {
      rel: "stylesheet",
      href: "/reset.css"
    })
  )


  function createTitle() {
    if (metadata.title && settings.title) {
      const titles = [metadata.title, ...settings.title.reverse()]
      return titles.join(" - ")
    }

    if (metadata.title || settings.title) {
      return metadata.title || settings.title.reverse()
    }

    return "Website"
  }

  const treeHead = h('head', [
    h('title', createTitle()),
    h('meta', {
      property: "og:description",
      content: metadata.description,
    }),
    ...treeStyleSheets,
    // TODO: Favicon
    // TODO: Site name
    // TODO: og:url
    // TODO: Canonical URL
    // TODO: REL=ME (github)
    // TODO: Webmention URL
    // TODO: Image
  ])


  function treeNavItems(navItem) {
    return h('a', {
      href: navItem.metadata.prettyURL,
      "aria-current": metadata.prettyURL === navItem.metadata.prettyURL ? 'page' : null
    }, navItem.metadata.breadcrumb)
  }

  function navItemFilter(nav_item) {
    return !nav_item.date
  }


  function treeNavFolder(navFolder) {
    return navFolder.length > 1
      ? h('nav.primary', navFolder.filter(navItemFilter).map(treeNavItems))
      : null
  }

  // TODO: Filter singleton navs
  // TODO: Filter ephemeral content

  const groupedNavs = Object.groupBy(family, ({ dir }) => dir)

  const treeNav = Object.values(groupedNavs).map(treeNavFolder)

  let treeBreadcrumbs = []

  if (settings.breadcrumbs) {
    treeBreadcrumbs.push(
      ...settings.breadcrumb.map((b, i) => h('a', {
        href: settings.prettyURL[i]
      }, b))
    )
  }

  treeBreadcrumbs.push(
    h('a', {
      href: destination.prettyURL,
      'aria-current': 'page'
    }, metadata.breadcrumb)
  )


  const headerElements = []

  if (settings.title) {
    headerElements.push(h('a.site-title', settings.title[0]))
  }

  if (settings.description) {
    headerElements.push(h('p.subtitle', settings.description[0]))
  }

  const treeHeader = h('header', [
    // TODO: Logo
    ...headerElements,
    ...treeNav,
    h('nav.breadcrumbs', {
      'aria-label': 'Breadcrumb'
    }, treeBreadcrumbs)
  ])

  // TODO: Add page ID as a class

  const treeMain = h('main.h-entry', toHast(abstract).children)

  visit(treeMain, (node, index, parent) => {
    if (node.type === "text" && parent.tagName === 'p' && parent.children.length === 1) {
      const validURL = testURL(node.value)
      if (validURL) {
        const metadata = database.getURL(node.value)
        if (metadata) {
          parent.tagName = "article"
          // TODO: Add url to metadata
          parent.children = [
            h("a", { href: node.value },
              h("h2", metadata.title)
            )
          ]
        }
      }
    }
  })

  // TODO: Write sidebar
  const treeSidebar = h('nav.secondary')
  const treeFooter = h('footer', `© ${new Date().getFullYear()}`)

  const treeBody = h('body.page', [
    treeHeader,
    treeMain,
    treeSidebar,
    treeFooter
  ])

  const tree = h(
    null,
    [
      // TODO: Add doctype
      h('html', [
        treeHead,
        treeBody
      ])
    ]
  )

  // Mutate
  // Get links
  // - section, article.thumbnail

  // TODO: WRITE HTML

  const data = rehype()
    .stringify(tree)


  return {
    data
  }
}

/** @type {Router} */
function router({ name, dir, inRootDir }) {
  if (name.startsWith("$")) return false
  if (dir.find(segment => segment.startsWith("$"))) return false

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
        name: dir.at(-1),
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

/** @type {ReadPath} */
async function readImagePath(string, database) {
  // TODO: Resize and optimize images

  return {
    metadata: {},
    abstract: { path: string }
  }
}

/** @type {ProcessorWrite} */
async function writeImage(destination, database, config) {
  const buffer = await fs.readFile(destination.path)
  return {
    buffer
  }
}

/** @type {VotivePlugin} */
const vowelMarkdown = {
  name: "vowel",
  processors: [markdownReader, cssWriter],
  router
}

/** @type {VotivePlugin} */
const vowelJpeg = {
  name: "vowel-jpeg",
  processors: [jpegLoader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}



/** @type {VotiveConfig} */
const config = {
  sourceFolder: ".",
  destinationFolder: "output",
  plugins: [
    vowelMarkdown,
    vowelJpeg
  ]
}


async function init() {
  const then = performance.now()
  // await fs.rm(config.destinationFolder, { recursive: true, force: true })
  // await fs.mkdir(config.destinationFolder, { recursive: true })
  const cache = await voot(config)
  console.log(styleText("red", (performance.now() - then).toFixed(4) + "ms"))
}


export default init

