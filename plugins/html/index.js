import path from "node:path"
import { hash } from "node:crypto"
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
import { testURL, testHashtags, createHashtagPage, toTitleCase, hashtagRegexSingle, createImagePaths, imageSizes, imageExts } from "./../../utils.js"
import extractDate from "./../../extractDate.js"
import { reservedProperties } from "./../markdown/metadata.js"
import { toString as hastToString } from 'hast-util-to-string'
import { unified } from "unified"
import { EXIT, SKIP, visit } from "unist-util-visit"
import toc from "@jsdevtools/rehype-toc"
import slug from "rehype-slug"
import createDynamicImage from "./image.js"
import { isExternalLinkParagraph } from "../urls/index.js"
import { globClasses } from "./editor/directives.js"
import { listPages } from "./../../utils.js"

/** @import * as Votive from "votive" */
/** @import * as Vowel from "./../../index.js" */

const VOWEL_DIR = path.normalize(path.join(import.meta.dirname, "../../"))

// Compiled from ./editor/main.js via rollup.config.js (`npm run
// build:editor` from vowel's root) - the Svedit editor and reload client
// for previewed pages, read once here and inlined into every previewed
// page. See tasks/desktop-app-architecture.md, Part 3.
const editorClientScript = readFileSync(path.join(import.meta.dirname, "bundle/index.js"), "utf-8")

/**
 * @param {array} array
 * @param {number} num
 */
/**
 * The site's title: the nearest `title` in the settings cascade, which
 * settings.md contributes when the author set one, else the title of the
 * index page - but only an index the author actually wrote. The
 * synthesized one (source null) is a placeholder called "Home" and
 * doesn't name a site. Both reads are tracked, so a page that shows
 * the site title is rebuilt when either changes.
 *
 * Resolved here rather than written back as a setting by the folder
 * pass: a folder hook that reads a label it also writes sees its own
 * previous pass, and the row flipped on every build (see readFolder in
 * plugins/markdown/index.js).
 * @param {any} settings
 * @param {any} api
 * @returns {string | undefined}
 */
function siteTitle(settings, api) {
  const configured = settings.last("title")
  if (configured) return configured
  const index = api.target("index.html")
  if (!index?.source) return
  return index.metadata.title
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
    treeMainHead.push(makeTime(date))
  }

  if (metadata.image || (metadata.first_image && url)) {
    const metaImage = metadata.image || metadata.first_image

    treeMainHead.push(
      createDynamicImage(metaImage, api, null, true)
    )
  }

  if (metadata.description) treeMainHead.push(
    h("p",
      {
        itemprop: "description"
      },
      metadata.description
    )
  )

  if (url) return h('a', { href: url }, treeMainHead)

  return treeMainHead
}

/** @param {Date} date */
function makeTime(date) {
  return h("time",
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
}

/**
 * Renders one frontmatter value by its type. Arrays become lists and
 * objects nested description lists, so the shape survives into the HTML
 * and the editor can read it back without being told what it was.
 * @param {unknown} value
 */
function makeValue(value) {
  if (Array.isArray(value)) {
    return h("ul", value.map(item => h("li", makeValue(item))))
  }

  if (value instanceof Date) return makeTime(value)

  if (value && typeof value === "object") {
    const rows = Object.entries(value).flatMap(([key, nested]) => {
      return [h("dt", key), h("dd", makeValue(nested))]
    })
    return h("dl", rows)
  }

  if (typeof value !== "string") return String(value)

  // extractDate returns an Invalid Date for things that merely look
  // date-shaped (a version string, an ISBN), so the guard matters.
  const date = extractDate(value)
  if (date && !isNaN(date)) return makeTime(date)

  if (testURL(value)) return h("a", { href: value }, value)

  return value
}

/**
 * The page's own frontmatter, one single-item <dl> per property, rendered
 * as children of <main> beside section#content. Properties vowel handles
 * specially get their own element instead - a bare <time> or <picture>,
 * identified by itemprop - since a description list adds nothing there.
 *
 * Only frontmatter is rendered. Data inferred from the content (a date the
 * author wrote at the top of the page) stays where they put it, marked up
 * in place by the markdown plugin.
 *
 * @param {object} metadata
 * @param {import("votive").PluginAPI} api
 * @param {Votive.VotiveConfig} config
 */
function makeFrontmatter(metadata, api, config) {
  const handled = ["title", "date", "image", "description"]

  const properties = (metadata.frontmatter_keys || []).filter(key => {
    return !handled.includes(key)
  })

  const known = []

  if (metadata.fm_date) {
    known.push(makeTime(new Date(metadata.fm_date)))
  }

  if (metadata.fm_image) {
    known.push(createDynamicImage(metadata.fm_image, api, null, true))
  }

  if (metadata.fm_description) {
    known.push(h("p", { itemprop: "description" }, metadata.fm_description))
  }

  const generic = properties.map(key => {
    const name = reservedProperties.includes(key) ? key : "fm_" + key
    return h("dl", [h("dt", key), h("dd", makeValue(metadata[name]))])
  })

  return [...known, ...generic]
}

/** @type {Votive.ProcessorWrite} */
function writeFile(target, { settings, api, config }) {

  /** @param {string} relativePath */
  function resolvePath(relativePath) {
    // A target created via api.createTarget() has no backing source file
    // (target.source is null), so there's no directory to resolve a
    // "./" link against - leave the href as the author wrote it.
    if (!target.source) return
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

    const pages = listPages(api, {
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
    return listPages(api, {
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

  // The theme's built-in sheets come from the settings cascade (the
  // folder pass is their one writer). The project's own come from a
  // listing: every .css target with a source - a file the author wrote,
  // not one vowel generated - in this page's folder and each ancestor,
  // root first so a subfolder's loads after, and overrides, the root's.
  // The chain ends with the page's own name as a folder, because that
  // is the chain its settings cascade uses (votive's pageSettingsFolder:
  // shop.html is the index of shop/, and gets shop/'s sheets). A listing
  // rather than a second writer to the same label: folder membership
  // tracks a sheet appearing or disappearing, which is all a <link>
  // needs. (Order among the two groups is cosmetic: every theme sheet
  // is in an @layer, and an unlayered project sheet wins over any layer
  // wherever it appears.)
  const projectSheets = [...ancestorFolders, targetAsDir].flatMap(folder => (
    api.targets({ folder, recursive: false })
      .filter(sheet => sheet.source && path.extname(sheet.path) === ".css")
      .map(sheet => sheet.path)
  ))

  const sheets = [...settings.flat("stylesheets"), ...projectSheets]

  sheets.forEach(sheet => {
        // Content hash, not Math.random() - a random value here changed
        // on every rebuild regardless of whether the CSS actually did,
        // which meant this <link>'s href always differed from the
        // previous build, which meant the live-reload client's head-diff always
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
        const cacheBuster = stylesheetTarget?.metadata?.hash ?? ""
        treeStyleSheets.push(
          h('link', {
            rel: "stylesheet",
            href: `/${sheet}?${cacheBuster}`
          })
        )
  })

  if (hasHighlightedCode) {
    if (!api.target("syntax-highlighting.css")) {
      const syntaxHighlightingStylesPath = path.join(VOWEL_DIR, "stylesheets", "SyntaxHighlightingStyles.css")
      const syntaxHighlightingStyles = readFileSync(syntaxHighlightingStylesPath, "utf-8")

      api.createTarget({
        path: "syntax-highlighting.css",
        data: syntaxHighlightingStyles,
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
      const title = [settings.last("title") || metadata?.title, settings.last("fm_tagline")]
        .filter(a => a)
        .join(" - ")

      return title
    }

    // FIXME Check that this works properly
    const chain = settings.flat("title").reverse()
    if (metadata.title && chain.length) {
      return [metadata.title, ...chain].join(" - ")
    }

    if (metadata.title && site) {
      return `${metadata.title} - ${site}`
    }

    if (metadata.title || chain.length) {
      return metadata.title || chain[0]
    }

    return "Website"
  }


  const site = siteTitle(settings, api)
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

  const settingsDomain = settings.last("fm_domain")
  if (settingsDomain) {
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
  if (site) {
    treeHead.children.push(h("meta", {
      property: "og:site_name",
      content: site
    }))
  }

  /* FIXME Properly handle this image */
  const icon = settings.last("icon")
  if (icon) {
    treeHead.children.push(h("link", {
      href: "/" + icon,
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

  // Sequence semantics: one crumb per ancestor, aligned by index.
  const crumbLabels = settings.raw("breadcrumbs")
  const breadcrumbs = ancestorFolders
    .map((folderPath, index) => [folderPath, crumbLabels?.[index]?.at(-1)])
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

  const logo = settings.last("fm_logo")
  if (logo) {
    headerElements.push(
      h('a#logo', {
        href: "/",
        "aria-label": "logo",
        rel: "home",
        "style": `--logo-url: url("/${logo}")`
      }, h("img", {
        src: "/" + logo,
        alt: ""
      }))
    )
  }

  const wordmark = settings.last("fm_wordmark")
  if (wordmark) {
    headerElements.push(h("a#wordmark", {
      href: "/",
      rel: "home"
    }, h("img", {
      src: "/" + wordmark
    })))
  }

  if (site) {
    headerElements.push(h('a#title', { href: "/", rel: "home" }, site))
  }

  const tagline = settings.last("fm_tagline")
  if (tagline) {
    headerElements.push(h('p#tagline', tagline))
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

  const treeMainHead = makeFrontmatter(metadata, api, config)

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
          const article = h('article.reference', makeHeader(target.metadata, target.metadata.prettyURL, api, config))

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

        const targets = listPages(api, {
          folder,
          recursive,
          query,
          orderBy: { property: "date", direction: "desc" },
          limit: count ? Number(count) : undefined
        })

        // Every parameter of the directive is carried in the class list so
        // the expansion can be collapsed back to "/blog/**?count=5" from
        // the rendered HTML alone - see plugins/html/editor/directives.js.
        const listClasses = globClasses({ folder, recursive, limit: count, tag })

        const list = h("ul", { class: listClasses },
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
      const preview = api.url(url)
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
      // The title is main's first child: the one piece of data hoisted out
      // of the content regardless of where the author placed it.
      ...(metadata.title ? [h("h1", metadata.title)] : []),
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
        const metadata = api.url(node.value)
        if (metadata) {
          parent.tagName = "article"
          // Marks this <article> as an expansion of a bare URL rather than
          // authored content, so the editor collapses it back to the URL.
          parent.properties = { ...parent.properties, className: ["link-preview"] }
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

  const everything = listPages(api, {
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

  try {
    
  const data = unified()
    .use(rehypePresetMinify)
    .use(rehypeStringify)
    .stringify(tree)

  return {
    data
  }

  } catch(e) {
    console.log({ tree, target, e })
  }
}

/**
 * Injects votive's live-reload client and the dev-preview save widget into
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
  fileSplit.splice(1, 0, `<script type="module">${editorClientScript}</script>`)
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