import path from "node:path"
import { hash } from "node:crypto"
import openSocket from "voot/client.js"
import rehypeHighlight from "rehype-highlight"
import rehypePresetMinify from "rehype-preset-minify"
import rehypeStringify from "rehype-stringify"
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
import { readFileSync } from "fs"
import { remove } from "unist-util-remove"
import { testURL, testHashtags, createHashtagPage, toTitleCase, hashtagRegexSingle, createImagePaths, imageSizes, imageExts } from "./../../utils.js"
import { toString as hastToString } from 'hast-util-to-string'
import { unified } from "unified"
import { EXIT, SKIP, visit } from "unist-util-visit"
import toc from "@jsdevtools/rehype-toc"
import slug from "rehype-slug"
import createDynamicImage from "./image.js"
import { isExternalLinkParagraph } from "../urls/index.js"

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

// Compiled from ./editor/SaveButton.svelte via rollup.config.js (`npm run
// build:editor` from vowel's root) - a small dev-preview widget that
// posts a timestamped file to voot's write endpoint, read once here and
// inlined into every previewed page the same way openSocket's reload
// client is below. See tasks/desktop-app-architecture.md, Part 3.
const editorClientScript = readFileSync(path.join(import.meta.dirname, "editorClient.js"), "utf-8")

/**
 * @param {array} array
 * @param {number} num
 */
function getLast(ancestorArrays, num = 1) {
  if (!ancestorArrays) return
  if (num > ancestorArrays.length) return
  const level = ancestorArrays.at(ancestorArrays.length - num)
  if (level && level.length) return level.at(-1)
  return getLast(ancestorArrays, num + 1)
}


/**
 * @param {object} metadata
 * @param {string} url
 * @param {import("votive").PluginAPI} api
 * @param {Votive.VotiveConfig} config
 */
function makeHeader(metadata, url, api, config) {

  const treeMainHead = []

  if (metadata.title) treeMainHead.push(
    h("h1", metadata.title)
  )

  if (metadata.date) {
    const date = new Date(metadata.date)
    treeMainHead.push(
      h("time",
        {
          datetime: date.toISOString(),
          itemprop: "date"
        },
        date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      )
    )
  }

  if (metadata.image || (metadata.first_image && url)) {
    const metaImage = metadata.image || metadata.first_image

    treeMainHead.push(
      createDynamicImage(metaImage, api, null, true)
    )
  }

  if (metadata.fm_description) treeMainHead.push(
    h("p",
      {
        itemprop: "description"
      },
      metadata.fm_description
    )
  )

  if (url) return h('a', { href: url }, treeMainHead)

  return treeMainHead
}

/** @type {Votive.ProcessorWrite} */
function writeFile(target, settings, api, config) {

  /** @param {string} relativePath */
  function resolvePath(relativePath) {
    if (relativePath.startsWith("./")) {
      const dir = path.dirname(target.source)
      const sourcePath = path.normalize(path.join(dir, relativePath))
      const targetFile = api.targetBySource(sourcePath)
      return targetFile.metadata.prettyURL
    }
  }

  visit(target.metadata.hastAbstract, { tagName: "a" }, (n, i, p) => {
    const resolvedPath = resolvePath(n.properties.href)
    if(resolvedPath) n.properties.href = resolvedPath
  })

  const isRoot = target.path === "index.html"


  if (target.metadata.type === "tag") {
    if (!target.metadata.tag) return false

    const pages = api.targets({
      recursive: true,
      query: {
        tags: target.metadata.tag
      }
    })

    if (!pages.length) return false
  }

  const { metadata, ...rest } = target
  const abstract = metadata.hastAbstract

  // Highlights fenced code blocks in place (adds an `hljs` class plus
  // per-token spans to any <code class="language-x">) - run early, before
  // treeStyleSheets below, so the stylesheet link can be added only for
  // pages that actually end up with a highlighted block.
  unified().use(rehypeHighlight).runSync(abstract)

  let hasHighlightedCode = false
  visit(abstract, { tagName: "code" }, (node) => {
    if (node.properties?.className?.includes("hljs")) {
      hasHighlightedCode = true
      return EXIT
    }
  })

  /** @param {string} filePath */
  function listFolders(filePath) {
    if (!filePath) return []

    const pathInfo = path.parse(filePath)
    const dir = pathInfo.dir && pathInfo.dir
    return [...listFolders(
      dir
    ), filePath]
  }

  const parsedPath = path.parse("" + target.path)

  const targetAsDir = path.relative("", path.format({
    dir: parsedPath.dir,
    name: parsedPath.name
  }))

  const ancestorFolders = listFolders(rest.dir)
  ancestorFolders.unshift("")

  const family = [...ancestorFolders, targetAsDir].flatMap(folder => {
    // FIXME typing
    return api.targets({
      folder: Array.isArray(folder) ? path.join(...folder) : folder,
      recursive: false,
      query: {
        "!": {
          "|": {
            local_menu_item: 0, // FIXME: Change to boolean,
            html_file: 0
          }
        }
      }
    })
  }).filter(({ path, dir }) => {
    return path && path !== "tags.html" && dir !== "tags"
  })

  const treeStyleSheets = []

  Object.values(settings.stylesheets).forEach(file => {
    if (file) {
      file.forEach(sheet => {
        // Content hash, not Math.random() - a random value here changed
        // on every rebuild regardless of whether the CSS actually did,
        // which meant this <link>'s href always differed from the
        // previous build, which meant voot/client.js's head-diff always
        // saw a "change" and always fell back to a full page reload
        // instead of a selective DOM patch. See
        // tasks/css-cache-buster-bug.md. Hashing the raw source (stored
        // at read time, styles/index.js's readCSS) rather than the
        // minified output - the processed CSS isn't persisted back into
        // the database, only written to disk - and lightningcss's
        // transform is deterministic for a fixed target-browser config,
        // so identical raw source always produces identical output.
        // Bonus over Math.random(): api.target() registers a real
        // dependency from this page to the stylesheet it references.
        const stylesheetTarget = api.target(sheet)
        const cacheBuster = stylesheetTarget?.abstract?.css
          ? hash("MD5", stylesheetTarget.abstract.css).slice(0, 8)
          : ""
        treeStyleSheets.push(
          h('link', {
            rel: "stylesheet",
            href: `/${sheet}?${cacheBuster}`
          })
        )
      })
    }
  })

  if (hasHighlightedCode) {
    if (!api.target("syntax-highlighting.css")) {
      const syntaxHighlightingStylesPath = path.join(VOWEL_DIR, "stylesheets", "SyntaxHighlightingStyles.css")
      const syntaxHighlightingStyles = readFileSync(syntaxHighlightingStylesPath, "utf-8")

      api.createTarget({
        path: "syntax-highlighting.css",
        abstract: { css: syntaxHighlightingStyles },
        metadata: {},
        extension: "css"
      })
    }

    treeStyleSheets.push(
      h('link', {
        rel: "stylesheet",
        href: "/syntax-highlighting.css"
      })
    )
  }

  function createTitle() {
    if (isRoot) {
      const title = [settings?.title?.[0]?.at(-1) || metadata?.title, settings?.fm_tagline?.[0]?.at(-1)]
        .filter(a => a)
        .join(" - ")

      return title
    }

    // FIXME Check that this works properly
    if (metadata.title && settings.title) {
      const titles = [metadata.title, ...Object.values(settings.title).flatMap(a => a).reverse()]
      return titles.join(" - ")
    }

    if (metadata.title || settings.title) {
      return metadata.title || getLast(settings.title)
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
    ...treeStyleSheets,
  ])

  if (settings.fm_domain?.[0]?.length) {
    const settingsDomain = settings.fm_domain[0].at(-1)
    const domain = settingsDomain.startsWith("http")
      ? settingsDomain
      : "https://" + settingsDomain

    const { href } = new URL(metadata.prettyURL, domain)

    treeHead.children.push(
      h("meta", {
        property: "og:url",
        content: href
      }),
      h("link", {
        rel: "canonical",
        href
      })
    )
  }

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
      content: getLast(settings.fm_title)
    }))
  }

  /* FIXME Properly handle this image */
  if (settings.icon) {
    treeHead.children.push(h("link", {
      href: "/" + getLast(settings.icon),
      rel: "icon",
      type: "image/png"
    }))
  }

  function treeNavItems(navItem) {
    return h('li', h('a', {
      href: navItem.metadata.prettyURL,
      "aria-current": metadata.prettyURL === navItem.metadata.prettyURL ? 'page' : null
    }, navItem.metadata.breadcrumb))
  }

  function navItemFilter(nav_item) {
    return !nav_item.metadata.date
      && nav_item.path !== "index.html"
      && nav_item.path !== "404.html"
      && nav_item.extension === ".html"
      && nav_item.path
  }

  function sort_items(a, b) {
    if (typeof a === "number" && typeof b === "number") return a - b
    if (typeof b === "number") return -1
    if (typeof a === "number") return 1
    if (a.metadata.breadcrumb && b.metadata.breadcrumb) return String(a.metadata.breadcrumb).localeCompare(String(b.metadata.breadcrumb))
  }

  function treeNavFolder(navFolder) {
    const sorted = navFolder
      .filter(navItemFilter)
      .toSorted(sort_items)

    return h('ul', sorted.map(treeNavItems))
  }


  const groupedNavs = Object.groupBy(family, ({ dir }) => dir)

  const treeNav = h('nav', Object.entries(groupedNavs)
    .sort(([a], [b]) => a.length - b.length)
    .map(([k, v]) => treeNavFolder(v))
    .filter(folder => folder.children.length)
  )

  let treeBreadcrumbs = []

  const breadcrumbs = ancestorFolders
    .map((folderPath, index) => [folderPath, settings.breadcrumbs?.[index]?.at(-1)])
    .filter(([, label]) => label != null)

  treeBreadcrumbs.push(
    ...breadcrumbs.map(([folderPath, label]) => {
      return h('a', {
        href: folderPath ? "/" + folderPath : "/"
      }, label)
    })
  )

  if (!isRoot) {
    treeBreadcrumbs.push(
      h('a', {
        href: target.metadata.prettyURL,
        'aria-current': 'page'
      }, metadata.breadcrumb)
    )
  }

  const headerElements = []

  const homeLink = []

  if (settings.fm_logo?.[0]?.length) {
    headerElements.push(
      h('a#logo', {
        href: "/",
        "aria-label": "logo",
        rel: "home",
        "style": `--logo-url: url("/${getLast(settings.fm_logo)}")`
      }, h("img", {
        src: "/" + getLast(settings.fm_logo),
        alt: ""
      }))
    )
  }

  if (settings.fm_wordmark && getLast(settings.fm_wordmark)) {
    headerElements.push(h("a#wordmark", {
      href: "/",
      rel: "home"
    }, h("img", {
      src: "/" + getLast(settings.fm_wordmark)
    })))
  }

  if (settings.title?.[0]?.length) {
    headerElements.push(h('a#title', { href: "/", rel: "home" }, getLast(settings.title)))
  }

  if (settings.fm_tagline && getLast(settings.fm_tagline)) {
    headerElements.push(h('p#tagline', getLast(settings.fm_tagline)))
  }

  const treeHeader = h('header', [
    ...headerElements,
    treeNav
  ])


  function testPaths(node, i, p) {
    if (node.type !== 'element') return
    if (node.tagName !== 'p') return
    if (node.children.length !== 1) return
    if (!node.children[0]) return
    if (!node.children[0].value) return
    return Boolean(node.children[0].value.match(/^\/\S*$/))
  }

  const slugger = unified()
    .use(slug)
    .use(toc, {
      customizeTOC: (toc) => {
        toc.properties = {
          "aria-label": "Contents"
        }
      }
    })

  const treeContentSlugged = slugger.runSync(abstract)

  const treeTableOfContents = treeContentSlugged.children.shift()

  const treeMainHead = makeHeader(metadata, null, api, config)

  treeMainHead.push(treeTableOfContents)

  visit(abstract, { tagName: "img" }, (node, index, parent) => {
    const { src, alt } = node.properties
    const image = createDynamicImage(src, api, alt)
    if (!image) return
    if (index === 0 && parent.children.length > 1) {
      const [_, ...caption] = parent.children
      parent.children = [
        h("figure", [image, h("figcaption", caption)])
      ]
    } else {
      parent.children.splice(index, 1, image)
    }
  })

  try {
    visit(abstract, testPaths, ({ children: [child] }, i, p) => {

      // const recursive = child.value.endsWith("**")
      // const many = child.value.endsWith("*")

      const url = new URL(child.value, "thismessage://")
      const { dir, base } = path.parse(url.pathname)
      const recursive = base === "**"
      const many = base === "*" || base === "**"

      if (!many) {
        const targetFilePathInfo = path.parse(child.value)
        targetFilePathInfo.ext ||= ".html"
        delete targetFilePathInfo.base
        const targetFilePath = path.relative("/", path.format(targetFilePathInfo))
        const target = api.target(targetFilePath)

        if (target) {
          const article = h('article', makeHeader(target.metadata, target.metadata.prettyURL, api, config))

          p.children.splice(i, 1, article)

          return SKIP
        }

      }

      if (many) {
        const folder = path.relative("/", dir)
        // const url = new URL(child.value, "thismessage://")
        const count = url.searchParams.get("count")
        const tag = url.searchParams.get("tag")
        const query = tag
          ? { tags: tag }
          : {}

        const targets = api.targets({
          folder,
          recursive,
          query,
          orderBy: { property: "date", direction: "desc" },
          limit: count ? Number(count) : undefined
        })

        const escapedDir = folder.replace("_", "--").replace(path.sep, "_")
        const escapedDirs = escapedDir.split("_").filter(a => a).map((segment, index, array) => {
          return "_" + array.slice(0, index + 1).join("_")
        })
        escapedDirs.unshift("_")
        const dirClasses = escapedDirs.join(".")

        const list = h(`ul.${dirClasses}`,
          targets.map(target => {
            return h('li',
              h('article', makeHeader(target.metadata, target.metadata.prettyURL, api, config))
            )
          })
        )

        p.children.splice(i, 1, list)

        return SKIP
      }

    })
  } catch (e) {
    // console.log(JSON.stringify(abstract, null, 2))
  }

  try {
    visit(abstract, isExternalLinkParagraph, ({ children: [child] }, i, p) => {
      const url = child.value
      const preview = api.url.get(url)
      if (!preview) return

      const card = h('a.link-preview', { href: url, target: "_blank", rel: "noopener noreferrer" }, [
        preview.image ? h('img.link-preview-image', { src: preview.image, alt: "" }) : null,
        h('span.link-preview-body', [
          h('span.link-preview-title', preview.title || url),
          preview.description ? h('span.link-preview-description', preview.description) : null
        ].filter(Boolean))
      ].filter(Boolean))

      p.children.splice(i, 1, card)

      return SKIP
    })
  } catch (e) {
    // console.log(JSON.stringify(abstract, null, 2))
  }

  try {
    remove(abstract, (n, i, p) => p.type === "root" && n.tagName === "h1")
  } catch (e) {
    // console.log(JSON.stringify(abstract, null, 2))
  }

  // function copyTreeWithoutArticles(tree) {
  //   if (tree.tagName !== 'article') {
  //     return {
  //       type: tree.type,
  //       tagName: tree.tagName,
  //       properties: tree.properties,
  //       children: tree.children?.map(copyTreeWithoutArticles)
  //     }
  //   }
  // }




  const treeMain = h('main',
    {
      itemscope: true
    },
    [
      h('nav', {
        'aria-label': 'Breadcrumbs'
      }, treeBreadcrumbs),
      treeMainHead,
      h('section#content', abstract)
    ])

  visit(treeMain, (node, index, parent) => {
    /* URLs */ if (node.type === "text" && parent.tagName === 'p' && parent.children.length === 1) {
      const validURL = testURL(node.value)
      if (validURL) {
        const metadata = api.url.get(node.value)
        if (metadata) {
          parent.tagName = "article"
          parent.children = [
            h("a", { href: node.value },
              h("h2", metadata.title)
            )
          ]
        }
      }
    } /* GFM Alerts */ else if (node.tagName === "blockquote") {
      if (node.children[1]
        && node.children[1].tagName === "p"
        && node.children[1].children.length === 1
        && node.children[1].children[0].type === "text"
      ) {
        const matches = node.children[1].children[0].value.match(/^\[!(\w+)\]$/)

        if (matches) {
          const [_, alertLabel] = matches

          node.tagName = "aside"
          node.properties = {
            class: `alert ${alertLabel.toLowerCase()}`
          }

          node.children.splice(0, 2, {
            type: "element",
            tagName: "h2",
            children: [
              {
                value: toTitleCase(alertLabel),
                type: "text"
              }
            ]
          })
        }

      }
    }
  })

  const everything = api.targets({
    folder: "",
    recursive: true,
  }).filter(target => target.path
    && target.path.endsWith(".html")
    && !target.metadata.date
  )

  const homeFile = everything.find(item => item.path === "index.html" && item.dir === "")

  const globalNavItems = everything.filter(item => {
    return item.dir === ""
      && item.path !== "index.html"
      && item.path !== "404.html"
      && item.path !== "tags.html"
      && item.metadata.global_menu_item !== 0 // FIXME: This data should come back as a boolean, not binary
      && item.metadata.html_file !== 0
  })
    .map(getChildren)

  globalNavItems.unshift(homeFile)

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
      items.filter(a => a).map(treeNavItem)
    )
  }

  const treeGlobalNav = h('nav',
    treeNavList(globalNavItems)
  )

  const treeAside = h('aside', treeGlobalNav)

  const treeFooter = h('footer', [
    h('section#copyright', `© ${new Date().getFullYear()}`),
    h('section#shoutout', [
      "Made with ",
      h('a', {
        href: "https://vowel.cc"
      }, "Vowel"),
    ])
  ])

  const pageClass = target.metadata.prettyURL
    .split("/")
    .filter(a => a)
    .map(a => a.replace("_", ""))
    .join("_")
    || "home"

  const treeBody = h(`body.${pageClass}`, [
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

  const data = unified()
    .use(rehypePresetMinify)
    .use(rehypeStringify)
    .stringify(tree)

  return {
    data
  }

}

/**
 * Injects voot's live-reload client and the dev-preview save widget into
 * a served HTML page - dev-server only, never touches what's written to
 * disk. This is the one place the CLI's own browser tab and an embedder
 * pointing a native window at the same server (vowel-desktop) actually
 * share UI - it's the same served HTML either way, so there's nothing
 * per-host to build. See tasks/desktop-app-architecture.md, Part 3.
 * @param {Buffer} body
 */
function handlePreviewRequest(body) {
  const html = body.toString("utf-8")
  const fileSplit = html.split("</body>")
  fileSplit.splice(1, 0, `<script>${openSocket.toString()}\n\nopenSocket()</script><script>${editorClientScript}</script>`)
  return fileSplit.join("")
}

// Vowel always synthesizes a 404.html target (see readFolder in
// markdown/index.js) - when a requested .html page doesn't exist, serve
// that instead of an empty 404 body.
function handlePreviewError() {
  return "404.html"
}

const writeHTML = {
  extensions: [".html"],
  format: "text",
  writeFile,
  handlePreviewRequest,
  handlePreviewError
}


/** @type {Votive.VotivePlugin} */
const vowelWriteHTMLPlugin = {
  name: "vowel-write-html",
  processors: [writeHTML],
}

export default vowelWriteHTMLPlugin