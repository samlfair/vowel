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
import generateRobots from "./robots.js"
import { h } from "hastscript"
import { hash } from "node:crypto"
import { styleText } from "node:util"

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */

/** @type {Votive.ReadText} */
function readFile(string, filePath, targetPath, api, config) {
  const urls = []

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

  const secretFileName = metadata.secret_key && hash("MD5", filePath + metadata.secret_key)
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

      if (validURL) {

        urls.push({
          data: node.value,
          runner: "text",
          target: targetPath
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

        // target.create() is upsert-safe and this is a deterministic
        // function of a fixed string - re-creating it once per
        // hashtag-bearing file converges to a no-op after the first,
        // without needing to check whether it already exists first.
        api.createTarget({
          path: `tags.html`,
          abstract: hast,
          metadata: {
            breadcrumb: "Tags",
            title: "Tags",
            prettyURL: "/tags",
            hastAbstract: hast,
          }
        })

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
              tag: hashtag,
              hastAbstract: abstract,
            }

            const created = api.createTarget({
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
      api.createTarget({
        path: "sitemap.xml",
        abstract: {},
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })

      api.createTarget({
        path: "feed.xml",
        abstract: {},
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })
    }
  }


  const hast = toHast(mdast, {
    unknownHandler: (_, n, p) => {
      if (n.type === "highlight") return h("mark", n.children)
      if (n.type === "time") return h("time", { datetime: n.datetime }, n.children)
    }
  })

  return {
    abstract: hast,
    filePath: secretFilePath,
    write: metadata.html_file ?? true,
    metadata: { ...metadata, hastAbstract: hast },
    settings: pathInfo.base === "settings.md" ? metadata : undefined
  }
}



/** @type {Votive.ReadAbstract} */
function transformFile(abstract, settings, api, config) {
  const urls = []
  return { abstract, urls }
}

/** @type {Votive.ReadFolder} */
function readFolder(folder, settings, api, config, isRoot) {
  if (folder === "") {
    api.createTarget({
      path: "robots.txt",
      abstract: {
        content: generateRobots()
      },
      metadata: {}
    })
  }

  const pageNotFound = api.target("404.html")

  if(!pageNotFound) {
    const abstract = toHast(fromMarkdown(`# 404\n\nPage not found.`))
    api.createTarget({
      abstract,
      metadata: {
        title: "Page not found",
        breadcrumb: "404",
        prettyURL: "404.html",
        hastAbstract: abstract,
      },
      path: "404.html",
      extension: ".html"
    })
  }

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


  const aliasFile = api.target(aliasPath)
  const indexFile = api.target(indexPath)

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
      api.createTarget({
        abstract,
        path: aliasPath,
        extension: ".html",
        metadata: {
          title: toTitleCase(folderInfo.name),
          breadcrumb: toTitleCase(folderInfo.name),
          prettyURL,
          hastAbstract: abstract,
        }
      })
    }
  } else {
    if (!indexFile) {
      const title = "Home"
      const prettyURL = "/"
      const indexPath = prettyURL + "/*"

      const abstract = toHast(fromMarkdown(`# ${title}\n\n${indexPath}`))
      api.createTarget({
        abstract,
        path: "index.html",
        extension: "html",
        metadata: {
          title,
          breadcrumb: title,
          prettyURL: "/",
          hastAbstract: abstract,
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

        api.createTarget({
          path: "reset.css",
          abstract: { css: resetStyles },
          metadata: {},
          extension: "css"
        })

        if (theme !== "reset") {
          newSettings.stylesheets.push("typography.css")

          const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
          const typeStyles = readFileSync(typeStylesPath, "utf-8")

          api.createTarget({
            path: "typography.css",
            abstract: { css: typeStyles },
            metadata: {},
            extension: "css"
          })

          if (theme !== "typography") {
            newSettings.stylesheets.push("default.css")

            const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")
            const defaultStyles = readFileSync(defaultStylesPath, "utf-8")

            api.createTarget({
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