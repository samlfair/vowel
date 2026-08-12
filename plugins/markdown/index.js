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
  const jobs = []

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

  return { abstract: hast, metadata }
}



/** @type {Votive.ReadAbstract} */
function transformFile(abstract, database, config) {
  const jobs = []
  return { abstract, jobs }
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
      syntax: ".html"
    })
  }

  const settings = database.setting.getByFolder(folder)

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
        syntax: ".html",
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
        syntax: "html",
        metadata: {
          title,
          breadcrumb: title,
          prettyURL: "/"
        }
      })
    }
  }

  if (isRoot) {
    setTheme(settings)

    function setTheme(settings) {
      const themes = [
        "reset",
        "typography",
        "default"
      ]

      if (themes.includes(settings.fm_theme?.[0]) || !settings.fm_theme) {
        if (!settings.fm_theme) database.setting.create("", "theme", "default")

        const theme = settings.fm_theme?.[0] || "default"

        if (themes.includes(theme)) {

          if (settings.stylesheets) {
            settings.stylesheets.push("reset.css")
          } else {
            database.setting.create(
              folder,
              "stylesheets",
              "reset.css",
            )

            settings = database.setting.getByFolder(folder)
          }

          const resetStylesPath = path.join(VOWEL_DIR, "stylesheets", "ResetStyles.css")
          const resetStyles = readFileSync(resetStylesPath, "utf-8")

          database.target.create({
            path: "reset.css",
            abstract: { css: resetStyles },
            metadata: {},
            syntax: "css"
          })

          if (theme === "reset") return

          settings.stylesheets.push("typography.css")

          const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
          const typeStyles = readFileSync(typeStylesPath, "utf-8")

          database.target.create({
            path: "typography.css",
            abstract: { css: typeStyles },
            metadata: {},
            syntax: "css"
          })

          if (theme === "typography") return

          settings.stylesheets.push("default.css")

          const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")
          const defaultStyles = readFileSync(defaultStylesPath, "utf-8")

          database.target.create({
            path: "default.css",
            abstract: { css: defaultStyles },
            metadata: {},
            syntax: "css"
          })
        }
      }
    }

    const site_title = settings.fm_title
      || settings.inferred_title
      || (indexFile && indexFile.metadata.title)

    if (site_title && !settings.title) {
      database.setting.create("", "title", site_title)
    }

    const tagline = settings.fm_tagline
      && settings.fm_tagline[0]
      || settings.inferred_description
      && settings.inferred_description[0]

    if (tagline) {
      database.setting.create("", "tagline", tagline)
    }

    const icon = settings.fm_icon
      && settings.fm_icon[0]

    if (icon) {
      database.setting.create("", "icon", icon)
    }
  }

  const breadcrumb = indexFile?.metadata?.breadcrumb
    || aliasFile?.metadata?.breadcrumb
    || toTitleCase(folder.split(path.sep).at(-2))
    || toTitleCase(folder.split(path.sep).at(-1))
    || "Home"

  database.setting.create(folder, "breadcrumbs", breadcrumb)

  return {
    jobs: [],
    destinations: []
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