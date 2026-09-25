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
import { ASIDE_PARTIAL, navPartialPath, backlinksPartialPath, createPartialStubs, expandPartial, withCurrent, partialsProcessor } from "./partials.js"

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
 * The site's name: the root settings.md's `name:`, else the title of the
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
function siteName(settings, api) {
  // The root's own `name:` - index 0 of the cascade - not the nearest
  // folder's: the header names the site, whatever section a page is
  // in. Sections contribute to <title> instead (createTitle).
  const configured = settings.raw("fm_name")?.[0]?.at(-1)
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

/**
 * The favicon's MIME type from its extension, for `<link rel=icon>`.
 * @param {string} iconPath
 */
function iconType(iconPath) {
  const ext = path.extname(iconPath).toLowerCase()
  const types = { ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" }
  return types[ext]
}

/** @param {Date} date */
function makeTime(date) {
  // Every date that reaches here was coerced to ISO at read
  // (frontmatter.js) or produced by extractDate; an Invalid Date would
  // throw in toISOString, so a null child (which hastscript drops) is
  // the guard for a value that arrived some other way.
  if (isNaN(Number(date))) return null
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
  const handled = ["title", "tagline", "date", "image", "description"]

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
  // The nav partial carries this page's folder chain: the header nav's
  // lists and the project stylesheets along it (see partials.js). One
  // read for both; a page whose own name is a folder takes that chain.
  const navPartial = api.target(navPartialPath(targetAsDir)) ?? api.target(navPartialPath(rest.dir))
  const projectSheets = navPartial?.metadata.sheets ?? []

  // The theme's sheets come from the same function the styles processor
  // enumerates from, so a sheet that is linked is a sheet that exists.
  // This page's theme is its folder's (a theme cascades like any
  // setting); the root's decides which theme gets the plain file names.
  const themeSheets = themeStylesheets(settings.lastNonNull("theme"), settings.raw("theme")?.[0]?.at(-1))

  // A stub stylesheet has a source path like any other source, so the
  // `sheet.source` test alone no longer separates vowel's sheets from the
  // project's - exclude them by name instead, or every theme sheet would
  // be linked twice.
  const sheets = [...themeSheets, ...projectSheets.map(sheet => sheet.path).filter(sheet => !themeSheets.includes(sheet))]
  const projectHash = new Map(projectSheets.map(sheet => [sheet.path, sheet.hash]))

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
        // A project sheet's hash rode in with the nav partial (one read for
        // the whole chain); a theme sheet's is read here, tracked.
        const cacheBuster = projectHash.has(sheet) ? projectHash.get(sheet) : (api.target(sheet)?.metadata?.hash ?? "")
        treeStyleSheets.push(
          h('link', {
            rel: "stylesheet",
            href: `/${sheet}?${cacheBuster}`
          })
        )
  })

  // The document title: the page's own title, then every `name:` from
  // the page's folder up to the root, then the page's own tagline,
  // hyphen-delimited - "Hats - Shop - Site - Warm heads". The homepage is
  // the site's front door and shows the site's name and its tagline.
  function createTitle() {
    if (isRoot) {
      return [site || metadata?.title, metadata?.fm_tagline]
        .filter(a => a)
        .join(" - ")
    }

    const names = settings.flat("fm_name").reverse()
    const chain = names.length ? names : (site ? [site] : [])
    const parts = [metadata.title, ...chain, metadata.fm_tagline].filter(a => a)
    return parts.length ? parts.join(" - ") : "Website"
  }


  const site = siteName(settings, api)
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

  // The page's AT Protocol record, for readers that verify a document
  // against its site (site.standard). Set by the atproto plugin's
  // transform only when the page has a record to point at.
  if (metadata.atUri) {
    treeHead.children.push(h("link", {
      rel: "site.standard.document",
      href: metadata.atUri
    }))
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

  // `icon` is a path, everywhere (Sam, Sept 19) - a URL path from the
  // root, resolved at read like `logo` (frontmatter.js). The type is
  // taken from its extension; a browser ignores a wrong one, but a
  // right one lets it pick between several.
  const icon = settings.lastNonNull("fm_icon")
  if (icon) {
    treeHead.children.push(h("link", {
      href: icon,
      rel: "icon",
      type: iconType(icon)
    }))
  }

  // The header nav is a partial: the lists for this page's folder chain,
  // computed once per pass by createPartialStubs and rendered once by
  // the partials processor. A page whose own name is a folder (shop.html
  // beside shop/) takes that folder's chain, which ends in its own
  // list; otherwise its folder's. The first lookup may miss - votive
  // tracks the miss, so the page is rebuilt if that folder appears.
  const treeNav = navPartial ? withCurrent(navPartial.metadata.hast, metadata.prettyURL) : h("nav")

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

    // A folder's index is `<folder>.html`, from an authored `<folder>.md`
    // beside it or the generated stub.
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


  const homeLink = []


  const logo = settings.lastNonNull("logo")
  const wordmark = settings.lastNonNull("fm_wordmark")

  const identityElements = []

  if(logo) {
    identityElements.push(h("img#logo", {
      src: logo,
      "aria-label": "Logo",
      style: `--logo-url: url("${logo}")`,
      alt: ""
    }))
  }

  if(wordmark) {
    identityElements.push(h("img#wordmark", {
      src: wordmark,
      "aria-label": "Wordmark",
      alt: ""
    }))
  }

  const identity = h("a", {
    href: "/",
    rel: "home"
  }, [...identityElements, h(null, site)])


  // if (site) {
  //   headerElements.push(h('a#title', { href: "/", rel: "home" }, site))
  // }

  // Same list in the header and the footer; a theme shows whichever it
  // wants. Built twice rather than shared: a hast node in two parents
  // would be visited twice by every rehype pass below.
  const treeHeader = h('header', [
    identity,
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

  // Who links here: a partial, declared only for a page something links
  // to (see partials.js). Outside section#content, beside the breadcrumbs
  // and the contents, because it is generated: the editor ingests
  // #content and must not see it. A page with no linkers reads a miss,
  // which votive tracks, so the first linker rebuilds it.
  const backlinksPartial = target.source ? api.target(backlinksPartialPath(target.path)) : undefined
  const treeBacklinks = backlinksPartial ? backlinksPartial.metadata.hast : null

  const treeMain = h('main',
    {
      itemscope: true
    },
    [
      // The title is main's first child: the one piece of data hoisted out
      // of the content regardless of where the author placed it.
      ...(metadata.title ? [h("h1", metadata.title)] : []),
      // A tagline is the page's, not the site's: under its title.
      ...(metadata.fm_tagline ? [h("p#tagline", metadata.fm_tagline)] : []),
      h('nav', {
        'aria-label': 'Breadcrumbs'
      }, treeBreadcrumbs),
      treeMainHead,
      h('section#content', abstract),
      treeBacklinks
    ].filter(Boolean))

  // The aside tree is one partial, the same on every page.
  const asidePartial = api.target(ASIDE_PARTIAL)
  const treeAside = h("aside", asidePartial ? asidePartial.metadata.hast : h("nav", h("ul")))

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
function previewSource(target, settings, config) {
  const rootSettings = settings?.raw?.("markdown")?.[0]
  return {
    path: target?.source ?? null,
    markdown: target?.metadata?.markdown ?? null,
    settings: { path: "settings.md", markdown: rootSettings?.at(-1) ?? null },
    // The in-page editor is not part of 1.0: it mounts only when the
    // dev server was started with `vowel --editor` (config.editor).
    // The client bundle is injected regardless, because it is also
    // the live-reload client.
    editor: config?.editor === true
  }
}

function handlePreviewRequest(body, { target, settings, config } = {}) {
  const html = body.toString("utf-8")
  const fileSplit = html.split("</body>")
  // "<" escaped so a "</script>" inside the markdown cannot end the tag.
  const source = JSON.stringify(previewSource(target, settings, config)).replaceAll("<", "\\u003c")
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
  // The partials (header nav per folder, the aside tree) are stubs this
  // processor declares and the partials processor reads.
  createStubs: ({ api }) => createPartialStubs(api),
  expandStubs: expandPartial,
  writeFile,
  handlePreviewRequest,
  handlePreviewError
}


/** @type {Votive.VotivePlugin} */
const vowelWriteHTMLPlugin = {
  name: "vowel-write-html",
  processors: [writeHTML, partialsProcessor],
}

export default vowelWriteHTMLPlugin