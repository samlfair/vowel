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
import { testURL, testHashtags, createHashtagPage, labelFromName, isPageWithoutFile, pageClasses, hashtagRegexSingle, imageSizes, mirrorPath } from "./../../utils.js"
import extractDate from "./../../extractDate.js"
import { reservedProperties, hiddenProperties } from "./../markdown/metadata.js"
import { toString as hastToString } from 'hast-util-to-string'
import { unified } from "unified"
import toc from "@jsdevtools/rehype-toc"
import slug from "rehype-slug"
import createDynamicImage, { dominantStyle, imageURL } from "./image.js"
import { listPages } from "./../../utils.js"
import { pageRecordURI } from "../atproto/record.js"
import { STATUSES } from "../markdown/frontmatter.js"
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
 * @param {string} [source] - the page's source path, for its classes
 */
function makeHeader(metadata, url, api, config, source) {

  const treeMainHead = []

  if (metadata.title) treeMainHead.push(
    h("h1", metadata.title)
  )

  if (metadata.date) {
    const date = new Date(metadata.date)
    treeMainHead.push(makeTime(date))
  }

  const metaImage = metadata.image || metadata.first_image
  if (metaImage) {
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

  // A card carries its page's classes, as the page's <body> does, and is
  // an item of its own: the itemprops inside it (date, description,
  // image) describe that page, not the page it's listed on. A page with
  // no file (`html_file: false`) has no url, so its card links nowhere.
  // Its image's dominant colour is the card's, for the card's own CSS.
  const article = h('article', {
    className: pageClasses(metadata.prettyURL, source),
    itemscope: true,
    style: dominantStyle(metaImage, api)
  }, treeMainHead)
  return url ? h('a', { href: url }, article) : article
}

/**
 * How many links a hast tree holds.
 * @param {any} node
 * @returns {number}
 */
function linkCount(node) {
  const own = node.tagName === "a" ? 1 : 0
  const children = node.children ?? []
  return children.reduce((sum, child) => sum + linkCount(child), own)
}

/**
 * The nav, or null when it has fewer than two links: a nav is only
 * rendered when there is somewhere else to go (per Sam). A one-entry
 * menu, a trail that is only the home crumb, a table of contents with
 * one heading are left out of the page, rather than hidden with CSS.
 * Social links are exempt: one link is still a `rel="me"` verification.
 * @param {any} nav - a hast element, or null
 */
function navWithChoices(nav) {
  if (!nav) return null
  return linkCount(nav) > 1 ? nav : null
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
/**
 * An element with one more class. Frontmatter properties carry their key
 * this way (`fm_date`, `fm_description`), which is how the editor tells
 * them from the same properties written in the text: those have the
 * itemprop and no class.
 * @param {any} node - a hast element, or nothing
 * @param {string} name
 */
function withClass(node, name) {
  if (!node) return node
  const className = [...(node.properties?.className ?? []), name]
  return { ...node, properties: { ...node.properties, className } }
}

/**
 * Natural metadata, lifted out of the content: the date line, image and
 * description the author wrote in the text, which the read marked
 * (`data-metadata`, metadata.js) and the write walk has already turned
 * into a <time>, a <picture> and a paragraph. Each becomes a direct
 * child of <main>, like its frontmatter equivalent but without the
 * `fm_` class; the rule that closed a description renders as nothing.
 * The source is untouched - only where the output puts them.
 * @param {any} tree - the walked content; the marked blocks are removed from it
 * @returns {any[]}
 */
function naturalMetadata(tree) {
  const isMarked = (node) => Boolean(node.properties?.dataMetadata)
  const marked = tree.children.filter(isMarked)
  tree.children = tree.children.filter(node => !isMarked(node))

  return marked.flatMap(node => {
    const { dataMetadata: kind, ...properties } = node.properties
    if (kind === "end") return []
    if (kind === "description") return [{ ...node, properties }]
    // A captioned image is a <figure> (writeRules.js) and is lifted
    // whole. The itemprop goes on its image, not the figure: an image is
    // the property, and the caption is not part of it.
    if (node.tagName === "figure") {
      const [image, ...caption] = node.children
      return [{ ...node, properties, children: [{ ...image, properties: { ...image.properties, itemprop: kind } }, ...caption] }]
    }
    // A date or an image paragraph only wrapped the one element that is
    // the metadata: the <time>, or the <picture> (an <img> until the
    // image has been read).
    const element = node.children.find(child => child.type === "element")
    if (!element) return []
    return [{ ...element, properties: { ...element.properties, itemprop: kind } }]
  })
}

function makeFrontmatter(metadata, api, config, natural = []) {
  const handled = ["title", "slogan", "date", "image", "description"]

  // hiddenProperties never render: the editor takes frontmatter from
  // the source file, so nothing is lost by leaving a key off the page.
  // `status` is shown only when it's the author's own word ("evergreen");
  // vowel's four (published, hidden, …) are instructions, not content.
  const ownStatus = !STATUSES.includes(metadata.fm_status)
  const properties = (metadata.frontmatter_keys || []).filter(key => {
    return !handled.includes(key) && !hiddenProperties.includes(key) && (key !== "status" || ownStatus)
  })

  const known = []

  if (metadata.fm_date) {
    known.push(withClass(makeTime(new Date(metadata.fm_date)), "fm_date"))
  }

  if (metadata.fm_image) {
    known.push(withClass(createDynamicImage(metadata.fm_image, api, null, true), "fm_image"))
  }

  if (metadata.fm_description) {
    known.push(h("p.fm_description", { itemprop: "description" }, metadata.fm_description))
  }

  const generic = properties.map(key => {
    const name = reservedProperties.includes(key) ? key : "fm_" + key
    return h(`dl.fm_${key}`, [h("dt", key), h("dd", makeValue(metadata[name]))])
  })

  return [...known, ...natural, ...generic]
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
  // A deleted page (`status: deleted`) is kept only for atproto-publish;
  // there is nothing to render.
  if (metadata.fm_status === "deleted") return undefined
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

  // The sheets a `styles:` names: each settings.md's along the chain,
  // root first, then the page's own frontmatter. A path is a URL path
  // from the root (frontmatter.js resolves it); a URL - a web font's
  // stylesheet - is linked as written. A path to no file is skipped,
  // with a warning: the <link> would 404. api.target() tracks it, so
  // the file appearing later relinks the page.
  // An empty `styles:` in a folder's settings.md is a null in the list.
  const listed = [...new Set([...(settings.flat("fm_styles") ?? []), ...(metadata.fm_styles ?? [])])]
    .filter(entry => typeof entry === "string")
  const external = listed.filter(entry => /^[a-z][a-z0-9+.-]*:|^\/\//i.test(entry))
  const named = listed
    .filter(entry => !external.includes(entry))
    .map(entry => ({ entry, sheet: entry.replace(/^\/+/, "").split("/").join(path.sep) }))
  const missing = named.filter(({ sheet }) => !api.target(sheet))
  missing.forEach(({ entry }) => config.log?.("warn", `${target.source ?? target.path}: styles names ${entry}, which isn't in the project`))
  const namedSheets = named.filter(({ sheet }) => !missing.some(gone => gone.sheet === sheet)).map(({ sheet }) => sheet)

  // A stub stylesheet has a source path like any other source, so the
  // `sheet.source` test alone no longer separates vowel's sheets from the
  // project's - exclude them by name instead, or every theme sheet would
  // be linked twice.
  const sheets = [...new Set([...themeSheets, ...projectSheets.map(sheet => sheet.path), ...namedSheets])]
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
  external.forEach(href => treeStyleSheets.push(h('link', { rel: "stylesheet", href })))

  // The document title: the page's own title, then every folder from
  // the page's up to the root, then the site's name, then the page's
  // own slogan, hyphen-delimited - "Hats - Shop - Site - Warm heads".
  // The homepage is the site's front door and shows the site's name and
  // its slogan.
  function createTitle() {
    if (isRoot) {
      return [site || metadata?.title, metadata?.fm_slogan]
        .filter(a => a)
        .join(" - ")
    }

    // Every folder between the page and the root, leaf first, by the
    // label its breadcrumb shows: its index page's. `name:` is the
    // site's, so the root (index 0) is left to `site`.
    const folders = ancestorFolders
      .map((folder, index) => index === 0 ? null : folderCrumb(folder, index).label)
      .slice(1)
      .reverse()
    const parts = [metadata.title, ...folders, site, metadata.fm_slogan].filter(a => a)
    return parts.length ? parts.join(" - ") : "Website"
  }


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
      || labelFromName(sourceName ?? folderPath.split(path.sep).at(-1))
    // folderPath is a stored folder (path.sep); an href is a url.
    return { label, href: indexTarget ? "/" + folderPath.split(path.sep).join("/") : null }
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
    // The plain description most search engines read; og: is for
    // link previews.
    ...(metadata.description ? [h('meta', { name: "description", content: metadata.description })] : []),
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

  // The page's markdown mirror (markdown/mirror.js), linked only while
  // it exists. A tracked read: the page is rebuilt when its mirror is
  // declared or removed, and not when the mirror is rewritten.
  const mirror = api.target(mirrorPath(target.path))
  if (mirror) {
    treeHead.children.push(h("link", {
      rel: "alternate",
      type: "text/markdown",
      href: "/" + mirror.path.split(path.sep).join("/")
    }))
  }

  // The page's AT Protocol record, for readers that verify a document
  // against its site: standard.site's convention, so only for a
  // site.standard.document, and only for a page that can be one - it
  // needs a title and a date (its `publishedAt`). Worked out here, from
  // the settings this write reads and so is rebuilt by, rather than
  // stored by a transform that only reruns when the page is re-read.
  const record = pageRecordURI(target, settings)
  if (record.warning) config.log?.("warn", `${target.path}: ${record.warning}`)
  const standardDocument = typeof record.uri === "string" && record.uri.split("/")[3] === "site.standard.document"
  if (standardDocument && metadata.title && metadata.date) {
    treeHead.children.push(h("link", {
      rel: "site.standard.document",
      href: record.uri
    }))
  }

  // The page's own image, else the site's `fallback_image` (a setting,
  // so a folder can have its own), so a link preview always has one.
  // The largest derivative of a png or jpeg (image.js): the original
  // is not published.
  const ogImage = imageURL(metadata.image || settings.lastNonNull("fm_fallback_image"), api, imageSizes.at(-1))
  if (ogImage) {
    treeHead.children.push(h("meta", {
      property: "og:image",
      content: ogImage
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
  // right one lets it pick between several. Without one, the project's
  // own favicon.png, else Vowel's placeholder (plugins/images). A
  // tracked read, so a favicon.png that appears later is linked.
  const icon = imageURL(settings.lastNonNull("fm_icon"), api, imageSizes[0])
    ?? (api.target("favicon.png") ? "/favicon.png" : "/favicon-placeholder.png")
  treeHead.children.push(h("link", {
    href: icon,
    rel: "icon",
    type: iconType(icon)
  }))

  // The header nav is a partial: the lists for this page's folder chain,
  // computed once per pass by createPartialStubs and rendered once by
  // the partials processor. A page whose own name is a folder (shop.html
  // beside shop/) takes that folder's chain, which ends in its own
  // list; otherwise its folder's. The first lookup may miss - votive
  // tracks the miss, so the page is rebuilt if that folder appears.
  const treeNav = navWithChoices(navPartial ? withCurrent(navPartial.metadata.hast, metadata.prettyURL) : null)

  let treeBreadcrumbs = []

  // Always an <a>, with or without an href: the breadcrumb's CSS styles
  // its links, and a <span> among them broke it. A crumb has no href
  // only when its folder has no index page to go to.
  treeBreadcrumbs.push(
    ...ancestorFolders
      .map(folderCrumb)
      .filter(crumb => crumb.label)
      .map(crumb => h('a', crumb.href ? { href: crumb.href } : {}, crumb.label))
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


  // The smallest derivative of a png or jpeg (image.js): the original
  // is not published. An SVG is linked as it is.
  const logo = imageURL(settings.lastNonNull("logo"), api, imageSizes[0])
  const wordmark = imageURL(settings.lastNonNull("fm_wordmark"), api, imageSizes[0])

  const identityElements = []

  if(logo) {
    identityElements.push(h("img#logo", {
      src: logo,
      "aria-label": "Logo",
      style: `--url-logo: url("${logo}")`,
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
    socialLinksNav(settings, api)
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

  // One walk for everything that renders against other targets, settings
  // or the url store: relative links, wikilinks, icons, code highlighting,
  // images, directives, link previews and alerts. See writeRules.js.
  // After the slugger, so a listing's headings stay out of the contents.
  const walked = { target, api, config, settings, makeHeader, makeTable, highlighted: false }
  writeWalk(abstract, walked)

  // After the walk, so a natural image is already its <picture>.
  const natural = naturalMetadata(abstract)
  const treeMainHead = makeFrontmatter(metadata, api, config, natural)

  const tableOfContents = navWithChoices(treeTableOfContents)
  if (tableOfContents) treeMainHead.push(tableOfContents)

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
      itemscope: true,
      // The page image's dominant colour, for anything in <main> to use.
      style: dominantStyle(metadata.image, api)
    },
    [
      // The title is main's first child: the one piece of data hoisted out
      // of the content regardless of where the author placed it.
      ...(metadata.title ? [h("h1", metadata.fm_title ? { className: ["fm_title"] } : {}, metadata.title)] : []),
      // A slogan is the page's, not the site's: under its title. An
      // itemprop, not an id: a listing can hold several, one per card.
      ...(metadata.fm_slogan ? [h("p.fm_slogan", { itemprop: "slogan" }, metadata.fm_slogan)] : []),
      navWithChoices(h('nav', {
        'aria-label': 'Breadcrumbs'
      }, treeBreadcrumbs)),
      treeMainHead,
      h('section#content', abstract),
      treeBacklinks
    ].filter(Boolean))

  // The aside tree is one partial, the same on every page. Without a
  // nav worth rendering there is no aside at all.
  const asidePartial = api.target(ASIDE_PARTIAL)
  const asideNav = navWithChoices(asidePartial ? asidePartial.metadata.hast : null)
  const treeAside = asideNav ? h("aside", asideNav) : null

  const treeFooter = h('footer', [
    socialLinksNav(settings, api),
    h('section#copyright', `© ${new Date().getFullYear()}`),
    h('section#shoutout', [
      "Made with ",
      h('a', {
        href: "https://vowel.cc"
      }, "Vowel"),
    ])
  ])

  const treeBody = h("body", { className: pageClasses(target.metadata.prettyURL, target.source) }, [
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

  // Not caught here: a throw is votive's to report (attempt.js), as one
  // error line naming the page, and the page stays stale. Caught and
  // logged here, it was marked fresh, and the old page stayed up.
  const data = unified()
    .use(rehypePresetMinify)
    .use(rehypeStringify)
    .stringify(tree)

  return {
    data
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
    if (name === "title" && isPageWithoutFile(target)) return h("td", value ?? "")
    if (name === "title") return h("td", h("a", { href: target.metadata.prettyURL }, value ?? target.metadata.prettyURL))
    if (value === undefined || value === null) return h("td")
    if (name === "image") return h("td", createDynamicImage(String(value), api, "") ?? String(value))
    if (name === "date") return h("td", makeTime(new Date(value)))
    if (Array.isArray(value)) return h("td", value.join(", "))
    return h("td", String(value))
  }

  // In a <figure>, like a markdown table (markdown/index.js). The
  // directive's parameters stay on the <table>, where the editor reads them.
  return h("figure", h("table", { class: classes }, [
    h("thead", h("tr", properties.map(name => h("th", name)))),
    h("tbody", targets.map(target => h("tr", properties.map(name => cell(target, name)))))
  ]))
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