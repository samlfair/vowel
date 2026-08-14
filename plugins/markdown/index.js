import path from "node:path"
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
import { normalizeHeadings } from 'mdast-normalize-headings'
import toc from "@jsdevtools/rehype-toc"
import { readFileSync } from "fs"
import { testURL, testHashtags, createHashtagPage, toTitleCase, hashtagRegexSingle, createImagePaths, imageSizes, imageExts } from "./../../utils.js"
import { toHast } from 'mdast-util-to-hast'
import { toString as hastToString } from 'hast-util-to-string'
import { visit } from "unist-util-visit"
import getMetadata from "./metadata.js"
import generateRobots from "./robots.js"

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */

function readURL(data) {
  const hast = fromHtml(data)
  const metadata = {}

  // TODO: Remove to a separate processor
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
function readFile(string, filePath, destinationPath, database, config) {
  const urls = []

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

  const metadata = getMetadata(mdast, filePath, destinationPath)

  if (!metadata.image) {
    const firstImageParagraph = mdast.children.find(child => child.children && child.children[0].type === "image")
    if (firstImageParagraph) {
      metadata.first_image = firstImageParagraph.children[0].url
    }
  }

  if (metadata.fm_published === false) return

  visit(mdast, (node, index, parent) => {
    if (node.type === "text" && parent.children.length === 1 && parent.type === "paragraph") {
      const validURL = testURL(node.value)

      if (validURL) {

        urls.push({
          data: node.value,
          runner: "text",
          destination: destinationPath
        })

        return
      }

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

        const markdown = `/tags/**`
        const mdast = fromMarkdown(markdown)
        const hast = toHast(mdast)

        const extant = database.target.get("tags.html")

        // FIXME: Update abstract format
        if (!extant) {
          // Delete if unnecessary
          database.target.create({
            path: `tags.html`,
            abstract: hast,
            metadata: {
              breadcrumb: "Tags",
              title: "Tags",
              prettyURL: "/tags",
            }
          })
        }

        database.dependency.track({}, "tags", null, destinationPath, "tags.html")
        database.target.markStale("tags.html")

        if (hashtags) {
          if (!metadata.tags) {
            metadata.tags = []
          } else if (!Array.isArray(metadata.tags)) {
            metadata.tags = []
          }

          metadata.tags = []

          hashtags.forEach(hashtag => {
            const title = toTitleCase(hashtag)
            metadata.tags.push(hashtag)

            const abstract = createHashtagPage(hashtag)

            const tagMetadata = {
              breadcrumb: title,
              title: title,
              prettyURL: `/tags/${hashtag}`,
              type: "tag",
              tag: hashtag
            }

            const created = database.target.create({
              path: `tags/${hashtag}.html`,
              abstract,
              metadata: tagMetadata
            })

          })
        }
      }
    }
  })


  if (filePath === "settings.md") {
    if (metadata.fm_domain) {
      database.target.create({
        path: "sitemap.xml",
        abstract: {},
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })

      database.target.create({
        path: "feed.xml",
        abstract: {},
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })
    }
  }


  const hast = toHast(mdast)

  return {
    abstract: hast,
    metadata,
    settings: pathInfo.base === "settings.md" ? metadata : undefined
  }
}



/** @type {Votive.ReadAbstract} */
function transformFile(abstract, database, config) {
  const urls = []
  return { abstract, urls }
}

/** @type {Votive.ReadFolder} */
function readFolder(folder, database, config, isRoot) {
  if (folder === "") {
    database.target.create({
      path: "robots.txt",
      abstract: {
        content: generateRobots()
      },
      metadata: {}
    })
  }

  

  const pageNotFound = database.target.getWithTrackers("404.html", folder)

  if(!pageNotFound) {
    const abstract = toHast(fromMarkdown(`# 404\n\nPage not found.`))
    database.target.create({
      abstract,
      metadata: {
        title: "Page not found",
        breadcrumb: "404",
        prettyURL: "404.html"
      },
      path: "404.html",
      extension: ".html"
    })
  }

  const settings = database.setting.getByFolder(folder)
  const newSettings = {}

  const folderInfo = path.parse(folder)

  const indexPath = path.relative("./", path.format({
    dir: path.join(folderInfo.dir, folderInfo.name),
    name: "index",
    ext: ".html"
  }))

  const aliasPath = path.format({
    dir: path.join(folderInfo.dir),
    name: folderInfo.name,
    ext: ".html"
  })


  const aliasFile = database.target.get(aliasPath)
  const indexFile = database.target.get(indexPath)

  if (!isRoot) {
    if (!aliasFile) {
      const title = toTitleCase(folderInfo.name)
      const prettyURL = (new URL("/" + path.normalize(
        path.format({
          dir: path.join(folderInfo.dir),
          name: folderInfo.name
        })
      ), "thismessage://")).pathname

      const indexPath = prettyURL + "/*"

      const abstract = toHast(fromMarkdown(`# ${title}\n\n${indexPath}`))
      database.target.create({
        abstract,
        path: aliasPath,
        extension: ".html",
        metadata: {
          title: toTitleCase(folderInfo.name),
          breadcrumb: toTitleCase(folderInfo.name),
          prettyURL
        }
      })
    }
  } else {
    if (!indexFile) {
      const title = "Home"
      const prettyURL = "/"
      const indexPath = prettyURL + "/*"

      const abstract = fromMarkdown(`# ${title}\n\n${indexPath}`)
      database.target.create({
        abstract,
        path: "index.html",
        extension: "html",
        metadata: {
          title,
          breadcrumb: title,
          prettyURL: "/"
        }
      })
    }
  }

  if (isRoot) {
    const themes = ["reset", "typography", "default"]
    const existingTheme = settings.fm_theme?.[0]?.at(-1)

    if (!existingTheme || themes.includes(existingTheme)) {
      if (!existingTheme) newSettings.theme = "default"

      const theme = existingTheme || "default"

      if (themes.includes(theme)) {
        newSettings.stylesheets = ["reset.css"]

        const resetStylesPath = path.join(VOWEL_DIR, "stylesheets", "ResetStyles.css")
        const resetStyles = readFileSync(resetStylesPath, "utf-8")

        database.target.create({
          path: "reset.css",
          abstract: { css: resetStyles },
          metadata: {},
          extension: "css"
        })

        if (theme !== "reset") {
          newSettings.stylesheets.push("typography.css")

          const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
          const typeStyles = readFileSync(typeStylesPath, "utf-8")

          database.target.create({
            path: "typography.css",
            abstract: { css: typeStyles },
            metadata: {},
            extension: "css"
          })

          if (theme !== "typography") {
            newSettings.stylesheets.push("default.css")

            const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")
            const defaultStyles = readFileSync(defaultStylesPath, "utf-8")

            database.target.create({
              path: "default.css",
              abstract: { css: defaultStyles },
              metadata: {},
              extension: "css"
            })
          }
        }
      }
    }

    const site_title = settings.fm_title?.[0]?.at(-1)
      || settings.inferred_title?.[0]?.at(-1)
      || (indexFile && indexFile.metadata.title)

    if (site_title && !settings.title?.[0]?.length) {
      newSettings.title = site_title
    }

    const tagline = settings.fm_tagline?.[0]?.at(-1)
      || settings.inferred_description?.[0]?.at(-1)

    if (tagline) {
      newSettings.tagline = tagline
    }

    const icon = settings.fm_icon?.[0]?.at(-1)

    if (icon) {
      newSettings.icon = icon
    }
  }

  const breadcrumb = indexFile?.metadata?.breadcrumb
    || aliasFile?.metadata?.breadcrumb
    || toTitleCase(folder.split(path.sep).at(-2))
    || toTitleCase(folder.split(path.sep).at(-1))
    || "Home"

  newSettings.breadcrumbs = breadcrumb

  return {
    urls: [],
    settings: newSettings,
    targets: []
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
const readMarkdown = {
  extensions: [".md"],
  format: "text",
  readFile,
  readResource: readURL,
  transformFile,
  readFolder,
}



/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [readMarkdown],
  router
}

export default vowelMarkdownPlugin