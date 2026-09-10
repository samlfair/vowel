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
import { themeColorSchemeCSS } from "./colorScheme.js"
import { typographyCSS } from "./typography.js"
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

/** @type {Votive.ProcessorRead} */
function readFile(source, { api, config }) {
  // Both project-relative (see SourceInput in votive/lib/bundle.js), so
  // filePath answers routing-shaped questions directly: `=== "settings.md"`
  // means the project's root settings file, and pathInfo.dir is a folder
  // within the site rather than somewhere on this machine.
  const { path: filePath, target: targetPath, text: string } = source
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

            const hashtagPage = createHashtagPage(hashtag)

            const tagMetadata = {
              breadcrumb: title,
              title: title,
              prettyURL: `/tags/${hashtag}`,
              type: "tag",
              tag: hashtag,
              hastAbstract: hashtagPage,
            }

            const created = api.createTarget({
              path: `tags/${hashtag}.html`,
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
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })

      api.createTarget({
        path: "feed.xml",
        metadata: {
          domain: metadata.fm_domain,
          title: metadata.title
        }
      })
    }
  }


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
  return { urls: [] }
}

/** @type {Votive.ProcessorReadFolder} */
function readFolder({ path: folder, isRoot }, { settings, api, config }) {
  if (folder === "") {
    api.createTarget({
      path: "robots.txt",
      data: generateRobots(),
      metadata: {}
    })
  }

  const pageNotFound = api.target("404.html")

  if(!pageNotFound) {
    const abstract = toHast(fromMarkdown(`# 404\n\nPage not found.`))
    api.createTarget({
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

    // A theme is either a bare name ("default") or an object carrying
    // its own configuration ({name: "default", colors: [...]}) - which
    // is what `theme.colors` means as a path. Both forms are accepted;
    // the object form is the only way to seed a color scheme.
    // `theme` is a reserved property (see metadata.js's
    // reservedProperties), so it is stored under its own name rather
    // than the "fm_" prefix the other frontmatter keys get. This read
    // was `settings.fm_theme`, a label nothing has ever written, so a
    // configured theme had never once been seen here - the fallthrough
    // happens to also produce "default", which is what hid it.
    const themeSetting = settings.theme?.[0]?.at(-1)
    const themeIsConfig = themeSetting && typeof themeSetting === "object" && !Array.isArray(themeSetting)
    const themeConfig = themeIsConfig ? themeSetting : { name: themeSetting }

    // Compared case-insensitively: settings.md is written by hand, and
    // "Default" is the name a person would reasonably type.
    const existingTheme = themeConfig.name && String(themeConfig.name).toLowerCase()

    if (!existingTheme || themes.includes(existingTheme)) {
      if (!existingTheme) newSettings.theme = "default"

      const theme = existingTheme || "default"

      if (themes.includes(theme)) {
        newSettings.stylesheets = ["reset.css"]

        const resetStylesPath = path.join(VOWEL_DIR, "stylesheets", "ResetStyles.css")
        const resetStyles = readFileSync(resetStylesPath, "utf-8")

        api.createTarget({
          path: "reset.css",
          data: resetStyles,
          metadata: {},
          extension: "css"
        })

        if (theme !== "reset") {
          newSettings.stylesheets.push("typography.css")

          const typeStylesPath = path.join(VOWEL_DIR, "stylesheets", "TypographyStyles.css")
          const typeStyles = readFileSync(typeStylesPath, "utf-8")

          api.createTarget({
            path: "typography.css",
            data: typeStyles,
            metadata: {},
            extension: "css"
          })

          // theme.font and its companions. Emitted after typography.css
          // and into a later cascade layer, so it overrides the static
          // sheet without either file referring to the other. Only the
          // chosen family's faces are emitted - a site that picked one
          // font ships one font.
          const dynamicType = typographyCSS(themeConfig)

          if (dynamicType) {
            newSettings.stylesheets.push("type.css")

            api.createTarget({
              path: "type.css",
              data: dynamicType.css,
              metadata: {},
              extension: "css"
            })

            const fontFiles = dynamicType.files

            for (const file of fontFiles) {
              // Named, not resolved: the fonts processor knows where
              // vowel's bundled fonts live and reads the bytes at write
              // time, so no machine-specific path is stored.
              api.createTarget({
                path: file,
                metadata: { bundled: file }
              })
            }
          }

          if (theme !== "typography") {
            // Tokens before the stylesheet that consumes them.
            // DefaultStyles.css reads --<role>-00..11 (see
            // stylesheets/brand-colors.css for the same shape written by
            // hand) and nothing else defines those, so this is emitted
            // unconditionally - a site that configured no colors gets
            // Vowel's brand pair rather than no variables at all.
            const colorScheme = themeColorSchemeCSS(themeConfig.colors, error => (
              console.warn(`${styleText("dim", "build: ")}${styleText("yellow", `ignoring theme.colors - ${error.message}`)}`)
            ))

            newSettings.stylesheets.push("colors.css")

            api.createTarget({
              path: "colors.css",
              data: colorScheme,
              metadata: {},
              extension: "css"
            })

            newSettings.stylesheets.push("default.css")

            const defaultStylesPath = path.join(VOWEL_DIR, "stylesheets", "DefaultStyles.css")
            const defaultStyles = readFileSync(defaultStylesPath, "utf-8")

            api.createTarget({
              path: "default.css",
              data: defaultStyles,
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
  router,
  readFile,
  writeFile: writeMarkdown,
  transformFile,
  readFolder,
}



/** @type {Votive.VotivePlugin} */
const vowelMarkdownPlugin = {
  name: "vowel",
  processors: [readMarkdown]
}

export default vowelMarkdownPlugin