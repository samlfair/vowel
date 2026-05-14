import extractDate from "./../../extractDate.js"
import path from "node:path"
import rehypeDocument from 'rehype-document'
import rehypePresetMinify from "rehype-preset-minify"
import rehypeStringify from "rehype-stringify"
import yaml from 'yaml'
import { fromHtml } from 'hast-util-from-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmFootnote } from "micromark-extension-gfm-footnote"
import { gfmFootnoteFromMarkdown } from "mdast-util-gfm-footnote"
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { h } from 'hastscript'
import { normalizeHeadings } from 'mdast-normalize-headings'
import { readFileSync } from "fs"
import { testURL } from "./../../utils.js"
import { toHast } from 'mdast-util-to-hast'
import { toString as hastToString } from 'hast-util-to-string'
import { toString as mdastToString } from 'mdast-util-to-string'
import { unified } from "unified"
import { visit } from "unist-util-visit"

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */


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


/** @type {Votive.ReadText} */
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


  // TODO: Add labels for aliases
  metadata.inferred_label = pathInfo.name
  const destinationInfo = path.parse(destinationPath)
  const name = destinationInfo.name === "index" ? "" : destinationInfo.name
  metadata.prettyURL = (new URL(`${destinationInfo.dir}/${name}`, "thismessage:/")).pathname
  const jobs = []

  selectMetadata(metadata)

  if (pathInfo.base === "settings.md") {
    for (const key in metadata) {
      database.setting.create(
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
    || metadata.slogan
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

/** @type {Votive.ReadAbstract} */
function readAbstract(abstract, database, config) {
  const jobs = []
  return { abstract, jobs }
}

/** @type {Votive.ReadFolder} */
function readFolder(folder, database, config, isRoot) {
  const settings = database.setting.getByFolder(folder)

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

  const indexFile = database.target.get(indexPath)
  const aliasFile = database.target.get(aliasPath)

  if (!indexFile && (!isRoot && !aliasFile)) {
    database.target.create({
      metadata: {
        title: folderInfo.name,
        breadcrumb: folderInfo.name,
        prettyURL: "/" + path.normalize(path.format({
          dir: path.join(folderInfo.dir),
          name: folderInfo.name
        }))
      },
      path: aliasPath,
      abstract: {},
      syntax: "mdast"
    })
  }



  if (isRoot) {
    const settings = database.setting.getByFolder(config.sourceFolder)

    setTheme(settings)

    function setTheme(settings) {
      const themes = [
        "reset",
        "typography",
        "default"
      ]


      if (themes.includes(settings.theme) || !settings.theme) {
        if (!settings.theme) database.setting.create("", "theme", "default")

        database.setting.create(
          "",
          "stylesheets",
          "reset.css"
        )

        const resetStylesPath = path.join(VOWEL_DIR, "stylesheets", "ResetStyles.css")

        if (settings.theme === "reset") return

        database.setting.create(
          "",
          "stylesheets",
          "typography.css"
        )

        if (settings.theme === "typography") return

        database.setting.create(
          "",
          "stylesheets",
          "default.css"
        )

        const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
        const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")

        const resetStyles = readFileSync(resetStylesPath, "utf-8")
        const typeStyles = readFileSync(typeStylesPath, "utf-8")
        const defaultStyles = readFileSync(defaultStylesPath, "utf-8")


        database.target.create({
          path: "reset.css",
          abstract: { css: resetStyles },
          metadata: {},
          syntax: "css"
        })

        database.target.create({
          path: "typography.css",
          abstract: { css: typeStyles },
          metadata: {},
          syntax: "css"
        })

        database.target.create({
          path: "default.css",
          abstract: { css: defaultStyles },
          metadata: {},
          syntax: "css"
        })
      }
    }

    // TODO: Create robots
    // TODO: Create RSS
    // TODO: Create sitemap


    const site_title = settings.fm_title
      || settings.inferred_title
      || (indexFile && indexFile.metadata.title)

    if (site_title && !settings.title) {
      database.setting.create("", "title", site_title)
    }

    const slogan = settings.fm_slogan
      && settings.fm_slogan[0]
      || settings.inferred_description
      && settings.inferred_description[0]

    if (slogan) {
      database.setting.create("", "slogan", slogan)
    }

    const icon = settings.fm_icon
      && settings.fm_icon[0]

    if (icon) {
      database.setting.create("", "icon", icon)
    }
  }

  const breadcrumb = indexFile?.metadata?.breadcrumb
    || aliasFile?.metadata?.breadcrumb
    || folder.split(path.sep).at(-2)
    || "Home"



  database.setting.create(folder, "breadcrumbs", breadcrumb)

  return {
    jobs: [],
    destinations: []
  }
}

/** @type {Votive.ProcessorWrite} */
function writeHTML(destination, database, config) {
  const isRoot = destination.path === "index.html"

  const settings = database.setting.getByFolder(destination.dir + path.sep)

  const { abstract, metadata, ...rest } = destination

  /** @param {string} filePath */
  function listFolders(filePath) {
    if (!filePath) return []

    const pathInfo = path.parse(filePath)
    const dir = pathInfo.dir && pathInfo.dir + path.sep

    return [pathInfo.base, ...listFolders(
      dir
    )]
  }

  const parsedPath = path.parse("" + destination.path)

  const destinationAsDir = path.relative("", path.format({
    dir: parsedPath.dir,
    name: parsedPath.name
  }))

  const ancestorFolders = listFolders(rest.dir)
  ancestorFolders.unshift("")

  // TODO: Multiple filters
  const family = [...ancestorFolders, destinationAsDir].flatMap(folder => {
    // FIXME typing
    return database.target.getManyWithTrackers({
      folder: Array.isArray(folder) ? path.join(...folder) : folder,
      recursive: false,
      dependent: destination.path,
      query: {}
    })
  })

  const treeStyleSheets = []

  Object.values(settings.stylesheets).forEach(file => {
    file.forEach(sheet => {
      const cacheBuster = Math.random().toString(36).slice(2, 10);
      treeStyleSheets.push(
        h('link', {
          rel: "stylesheet",
          href: `/${sheet}?${cacheBuster}`
        })
      )
    })
  })

  function createTitle() {
    if (isRoot) {
      const title = [settings.title[0] || metadata.title, settings.slogan]
        .filter(a => a)
        .join(" - ")
      return title
    }

    // TODO Check that this works properly
    if (metadata.title && settings.title) {
      const titles = [metadata.title, ...Object.values(settings.title).flatMap(a => a).reverse()]
      return titles.join(" - ")
    }

    if (metadata.title || settings.title) {
      return metadata.title || settings.title.reverse()
    }

    return "Website"
  }


  const title = createTitle()

  const treeHead = h('head', [
    h('meta', {
      charset: "UTF-8",
    }),
    h("meta", {
      name: "viewport",
      content: "width=device-width, initial-scale=1.0"
    }),
    h("meta", {
      "http-equiv": "X-UA-Compatible",
      content: "ie-edge"
    }),
    h('title', title),
    h('meta', {
      property: "og:title",
      content: title
    }),
    h('meta', {
      property: "og:description",
      content: metadata.description,
    }),
    h("meta", {
      property: "og:url",
      content: metadata.prettyURL
    }),
    ...treeStyleSheets,
  ])


  if (metadata.image) {
    treeHead.children.push(h("meta", {
      property: "og:image",
      content: metadata.image
    }))
  }

  /* FIXME this could be a section title */
  if (settings.title) {
    treeHead.children.push(h("meta", {
      property: "og:site_name",
      content: settings.title[0]
    }))
  }

  /* TODO Properly handle this image */
  if (settings.icon) {
    treeHead.children.push(h("link", {
      href: "/" + settings.icon[0],
      rel: "icon",
      type: "image/png"
    }))
  }

  // TODO: FIGURE OUT WHY NAV ITEMS HAVE EXTRA 'SHOP' and 'MORE' segments

  function treeNavItems(navItem) {
    return h('a', {
      href: navItem.metadata.prettyURL,
      "aria-current": metadata.prettyURL === navItem.metadata.prettyURL ? 'page' : null
    }, navItem.metadata.breadcrumb)
  }

  function navItemFilter(nav_item) {
    return !nav_item.metadata.date && nav_item.path !== "index.html"
  }

  function sort_items(a, b) {
    if (typeof a === "number" && typeof b === "number") return a - b
    if (typeof b === "number") return -1
    if (typeof a === "number") return 1
    if (a.metadata.breadcrumb && b.metadata.breadcrumb) return a.metadata.breadcrumb.localeCompare(b.metadata.breadcrumb)
  }


  function treeNavFolder(navFolder) {
    const sorted = navFolder
      .filter(navItemFilter)
      .toSorted(sort_items)

    return h('nav.local', sorted.map(treeNavItems))
  }


  // TODO: Filter singleton navs
  // TODO: Filter ephemeral content
  //


  const groupedNavs = Object.groupBy(family, ({ dir }) => dir)

  const treeNav = Object.values(groupedNavs).map(treeNavFolder)

  let treeBreadcrumbs = []



  const breadcrumbs = Object.entries(settings.breadcrumbs)
    .sort(([a], [b]) => a.length - b.length)
    .map(([path, [label]]) => [path, label])


  treeBreadcrumbs.push(
    ...breadcrumbs.map(([path, label]) => {
      return h('a', {
        href: path
      }, label)
    })
  )

  treeBreadcrumbs.push(
    h('a', {
      href: destination.metadata.prettyURL,
      'aria-current': 'page'
    }, metadata.breadcrumb)
  )

  const headerElements = []

  if (settings.title) {
    headerElements.push(h('a', { href: "/", rel: "home" }, settings.title[""]))
  }

  if (settings.slogan) {
    headerElements.push(h('p.slogan', settings.slogan[0]))
  }

  const treeHeader = h('header', [
    // TODO: Logo
    ...headerElements,
    ...treeNav,
  ])

  function testPaths(n, i, p) {
    if (n.type !== 'paragraph') return
    if (n.type !== 'text') return
    const matched = Boolean(n.value.match(/^\/\S*$/))
    return matched
  }

  visit(abstract, testPaths, (n, i, p) => {
    console.log(n)
  })

  // TODO: Add page ID as a class

  const treeMain = h('main.h-entry',
    [
      h('nav.breadcrumbs', {
        'aria-label': 'Breadcrumb'
      }, treeBreadcrumbs),
      ...toHast(abstract).children
    ])

  visit(treeMain, (node, index, parent) => {
    if (node.type === "text" && parent.tagName === 'p' && parent.children.length === 1) {
      const validURL = testURL(node.value)
      if (validURL) {
        const metadata = database.url.get(node.value)
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

  // TODO: Filter for targets that have a path set
  // TODO: Filter for targets by extension
  // FIXME this type should work fine

  const everything = database.target.getManyWithTrackers({
    folder: "",
    recursive: true,
    dependent: destination.path,
  })

  const globalNavItems = everything.filter(item => {
    return item.dir === ""
      && item.path !== "index.html"
      && !item.metadata.date
  })
    .map(getChildren)

  function getChildren(item) {
    const children = everything.filter(child => {
      return "/" + child.dir === item.metadata.prettyURL
        && child.path !== "index.html"
    })

    const populatedChildren = children.length > 0 && children.map(child => {
      return getChildren(child)
    })

    const node = {
      path: "/" + item.path,
      metadata: item.metadata
    }

    if (populatedChildren) node.children = populatedChildren

    return node
  }

  function treeNavItem(item) {
    if (item.children) {
      return h('li', [
        h('a', { href: item.path }, item.metadata.breadcrumb),
        treeNavList(item.children)
      ])
    }

    return h('li',
      h('a', { href: item.path }, item.metadata.breadcrumb)
    )
  }

  function treeNavList(items) {
    return h('ul',
      items.map(treeNavItem)
    )
  }

  const treeGlobalNav = h('nav.global',
    treeNavList(globalNavItems)
  )

  const treeAside = h('aside', treeGlobalNav)

  const treeFooter = h('footer', [
    h('section.copyright', `© ${new Date().getFullYear()}`),
    h('section.shoutout', [
      "Made with ",
      h('a', {
        href: "https://vowel.cc"
      }, "Vowel"),
    ])
  ])

  const treeBody = h('body', [
    treeHeader,
    treeMain,
    treeAside,
    treeFooter
  ])

  const tree = h(
    null,
    [
      {
        type: "doctype",
        name: 'html'
      },
      h('html',
        {
          lang: "en"
        },
        [
          treeHead,
          treeBody
        ]
      )
    ]
  )

  // TODO
  // Mutate
  // Get links

  const data = unified()
    .use(rehypePresetMinify)
    .use(rehypeStringify)
    .stringify(tree)

  return {
    data
  }
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
const markdownReader = {
  extensions: [".md"],
  format: "text",
  readFile: readMarkdown,
  readResource: readURL,
  transformFile: readAbstract,
  readFolder: readFolder,
}

const htmlWriter = {
  extensions: [".html"],
  format: "text",
  writeFile: writeHTML
}


/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [markdownReader, htmlWriter],
  router
}