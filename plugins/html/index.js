import path from "node:path"
import { hash } from "node:crypto"
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
import { reservedProperties, hiddenProperties } from "./../markdown/metadata.js"
import { toString as hastToString } from 'hast-util-to-string'
import { unified } from "unified"
import toc from "@jsdevtools/rehype-toc"
import slug from "rehype-slug"
import createDynamicImage from "./image.js"
import { listPages } from "./../../utils.js"
import { themeStylesheets, isVowelStylesheet } from "../styles/theme.js"
import { displayPath } from "../../secretPaths.js"
import { socialLinksNav } from "./socialLinks.js"
import { writeWalk } from "./writeRules.js"

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
  const configured = settings.lastNonNull("title")
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

  if (url) return h('a', { href: url }, h('article', treeMainHead))

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

  // hiddenProperties never render: the editor takes frontmatter from
  // the source file, so nothing is lost by leaving a key off the page.
  const properties = (metadata.frontmatter_keys || []).filter(key => {
    return !handled.includes(key) && !hiddenProperties.includes(key)
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

  const isRoot = target.path === "index.html"


  // A tag page used to delete itself here when no page carried its tag
  // any more, because nothing retracted a target its creator stopped
  // creating. It is a stub now: it exists exactly while the markdown
  // enumerator still lists that tag, and stops existing - row and file -
  // the moment it does not. No self-deleting targets.

  const { metadata, ...rest } = target
  const abstract = metadata.hastAbstract

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
  // Vowel's own sheets sit at the root beside the project's, each with
  // a source path (they are stubs), so they are excluded by name:
  // another folder's colors-<key>.css, and syntax-highlighting.css,
  // which is linked below only on pages with code - it used to be
  // picked up here as a project sheet on every page.
  const projectSheets = [...ancestorFolders, targetAsDir].flatMap(folder => (
    api.targets({ folder, recursive: false })
      .filter(sheet => sheet.source && path.extname(sheet.path) === ".css" && !isVowelStylesheet(sheet.path))
      .map(sheet => sheet.path)
  ))

  // The theme's sheets come from the same function the styles processor
  // enumerates from, so a sheet that is linked is a sheet that exists.
  // This page's theme is its folder's (a theme cascades like any
  // setting); the root's decides which theme gets the plain file names.
  const themeSheets = themeStylesheets(settings.lastNonNull("theme"), settings.raw("theme")?.[0]?.at(-1))

  // A stub stylesheet has a source path like any other source, so the
  // `sheet.source` test alone no longer separates vowel's sheets from the
  // project's - exclude them by name instead, or every theme sheet would
  // be linked twice.
  const sheets = [...themeSheets, ...projectSheets.filter(sheet => !themeSheets.includes(sheet))]

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

  function createTitle() {
    if (isRoot) {
      const title = [settings.lastNonNull("title") || metadata?.title, settings.lastNonNull("fm_tagline")]
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

  const settingsDomain = settings.lastNonNull("fm_domain")
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
  // fm_icon directly: settings.md already contributes it, and the folder
  // pass copied it to `icon` for no reason.
  const icon = settings.lastNonNull("fm_icon")
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

  /**
   * A folder's crumb, deduced from the path at render time rather than
   * read from a `breadcrumbs` setting the folder pass used to write.
   *
   * The folder pass is gone, and this is a better place for it anyway:
   * the lookup is tracked, so renaming a section's index page restales
   * every page whose breadcrumb names it - which the setting never did.
   *
   * A folder with an index page is a link and takes that page's own
   * breadcrumb. A folder without one is just a label: vowel no longer
   * generates a page per folder, so linking there would 404.
   */
  // A secret folder's target segment is a hash, so its readable name has
  // to come from the page's own *source* path - de-salted, because the
  // source keeps the salt and the salt must never reach the page. The
  // page has one ancestor per target segment and one per source segment,
  // aligned by depth, which is what lets the two be zipped.
  const sourceFolderNames = target.source
    ? displayPath(target.source).split(path.sep).slice(0, -1)
    : []

  function folderCrumb(folderPath, index) {
    if (!folderPath) {
      const home = api.target("index.html")
      return { label: home?.metadata?.breadcrumb || "Home", href: "/" }
    }

    // `<folder>/home.md` routes to `<folder>.html` - vowel's convention
    // for a section index.
    const indexTarget = api.target(`${folderPath}.html`)
    // index 0 is the root, so ancestor i is source segment i - 1.
    const sourceName = sourceFolderNames[index - 1]
    const label = indexTarget?.metadata?.breadcrumb
      || toTitleCase(sourceName ?? folderPath.split(path.sep).at(-1))
    // folderPath is a stored folder (path.sep); an href is a url.
    return { label, href: indexTarget ? "/" + folderPath.split(path.sep).join("/") : null }
  }

  treeBreadcrumbs.push(
    ...ancestorFolders
      .map(folderCrumb)
      .filter(crumb => crumb.label)
      .map(crumb => crumb.href
        ? h('a', { href: crumb.href }, crumb.label)
        : h('span', crumb.label))
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

  const logo = settings.lastNonNull("logo")
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

  const wordmark = settings.lastNonNull("fm_wordmark")
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

  const tagline = settings.lastNonNull("fm_tagline")
  if (tagline) {
    headerElements.push(h('p#tagline', tagline))
  }

  // Same list in the header and the footer; a theme shows whichever it
  // wants. Built twice rather than shared: a hast node in two parents
  // would be visited twice by every rehype pass below.
  const treeHeader = h('header', [
    ...headerElements,
    treeNav,
    socialLinksNav(settings)
  ])


  const slugger = unified()
    .use(slug)
    .use(toc, {
      // No class per level, item and link: the nesting is the <ol>
      // structure, and `nav[aria-label=Contents]` is the hook. An empty
      // string is how rehype-toc turns each one off.
      cssClasses: { toc: "", list: "", listItem: "", link: "" },
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

  // One walk for everything that renders against other targets, settings
  // or the url store: relative links, wikilinks, icons, code highlighting,
  // images, directives, link previews and alerts. See writeRules.js.
  // After the slugger, so a listing's headings stay out of the contents.
  const walked = { target, api, config, settings, makeHeader, makeTable, highlighted: false }
  writeWalk(abstract, walked)

  if (walked.highlighted) {
    // syntax-highlighting.css is always declared by the styles processor
    // (a stub); a page only decides whether to link it.
    treeHead.children.push(h('link', { rel: "stylesheet", href: "/syntax-highlighting.css" }))
  }

  // Who links here. A listing filtered on `links`, so it stays correct
  // by the ordinary rule: a page gaining or losing a link to this one
  // restales this page. Matched by this page's source path (a `./` link)
  // or its prettyURL (a `/` link) - two spellings of one page. Outside
  // section#content, beside the breadcrumbs and the contents, because it
  // is generated: the editor ingests #content and must not see it.
  const backlinks = target.source
    ? listPages(api, {
        recursive: true,
        query: { "|": [
          { links: { "~": target.source } },
          { links: { "~": metadata.prettyURL } },
          // A wikilink is recorded by name; two notes sharing one both
          // list the linking page, which is the ambiguity the author wrote.
          ...(metadata.inferred_label ? [{ links: { "~": `[[${metadata.inferred_label}]]` } }] : [])
        ] }
      }).filter(page => page.path !== target.path)
    : []

  const treeBacklinks = backlinks.length
    ? h('section#backlinks', [
        h('h2', 'Linked from'),
        h('ul', backlinks.map(page => h('li', h('a', { href: page.metadata.prettyURL }, page.metadata.title || page.metadata.prettyURL))))
      ])
    : null

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
      h('section#content', abstract),
      treeBacklinks
    ].filter(Boolean))

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
    socialLinksNav(settings),
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
 * The table view of a glob directive: one row per page, one column per
 * named property. `title` links to the page, `image` renders it, `date`
 * is a <time>, an array is joined, anything else is text. A property
 * no page has still gets its column - the author asked for it.
 * @param {string[]} classes
 * @param {string[]} properties
 * @param {any[]} targets
 * @param {import("votive").PluginAPI} api
 */
function makeTable(classes, properties, targets, api) {
  const valueOf = (metadata, name) => metadata[name] ?? metadata["fm_" + name]

  const cell = (target, name) => {
    const value = valueOf(target.metadata, name)
    if (name === "title") return h("td", h("a", { href: target.metadata.prettyURL }, value ?? target.metadata.prettyURL))
    if (value === undefined || value === null) return h("td")
    if (name === "image") return h("td", createDynamicImage(String(value), api, "") ?? String(value))
    if (name === "date") return h("td", makeTime(new Date(value)))
    if (Array.isArray(value)) return h("td", value.join(", "))
    return h("td", String(value))
  }

  return h("table", { class: classes }, [
    h("thead", h("tr", properties.map(name => h("th", name)))),
    h("tbody", targets.map(target => h("tr", properties.map(name => cell(target, name)))))
  ])
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
/**
 * What the in-page editor and the settings panel need to save: the
 * page's source path and text, and the root settings.md's. Put into the
 * page here, in the preview only - a served file is never what was
 * written to disk, and the source path of a secret page carries its
 * salt, which is fine in the author's own browser and nowhere else.
 * `settings` is the folder's view; the root slot of `markdown` is the
 * root settings.md, or null when the project has none yet.
 */
function previewSource(target, settings) {
  const rootSettings = settings?.raw?.("markdown")?.[0]
  return {
    path: target?.source ?? null,
    markdown: target?.metadata?.markdown ?? null,
    settings: { path: "settings.md", markdown: rootSettings?.at(-1) ?? null }
  }
}

function handlePreviewRequest(body, { target, settings } = {}) {
  const html = body.toString("utf-8")
  const fileSplit = html.split("</body>")
  // "<" escaped so a "</script>" inside the markdown cannot end the tag.
  const source = JSON.stringify(previewSource(target, settings)).replaceAll("<", "\\u003c")
  fileSplit.splice(1, 0, `<script type="application/json" id="vowel-source">${source}</script><script type="module">${editorClientScript}</script>`)
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