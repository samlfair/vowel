import { hostSlug } from "votive"
import { default as parseURLMetadata } from "./urlMetadata.js"

/** @import * as Votive from "votive" */

/**
 * A pure url reader. This plugin does not ask for anything: the html
 * plugin asks, at write time, for every bare-url paragraph it renders,
 * and votive drains the fetch queue after writeFile so that ask is
 * fetched in the same pass. A transform-side walker used to live here
 * too, which meant two walks over every page's tree for one question -
 * and html-specific knowledge in a plugin whose job is parsing what came
 * back.
 */

/**
 * A readable path for a fetched page's file in the url store:
 * `<host>/<last path segment or "index">`. The filename is not the
 * identity - the url inside the file is - so this only has to be
 * something a person can find. Votive appends a tiebreaker and `.yaml`.
 * @param {URL} url
 */
function previewPath(url) {
  const segments = url.pathname.split("/").filter(Boolean)
  const leaf = (segments.at(-1) || "index")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "index"
  return `${hostSlug(url)}/${leaf}`
}

/**
 * Parses a fetched page into the flat shape link-preview rendering
 * wants, preferring OpenGraph, then standard meta tags, then Twitter
 * Card, for each field independently, and says where to file it.
 * The body method is lazy, so a plugin that only wanted headers would
 * never read it; this one wants the HTML.
 * @type {Votive.ProcessorReadURL}
 */
async function parseLinkPreview(response) {
  const meta = parseURLMetadata(await response.text())
  return {
    path: previewPath(response.url),
    data: {
      title: meta.openGraph.title || meta.title || meta.twitterCard.title || "",
      description: meta.openGraph.description || meta.description || meta.twitterCard.description || "",
      image: meta.openGraph.image || meta.twitterCard.image || undefined
    }
  }
}

/**
 * Parses what was fetched. A `format: "url"` processor's extensions are
 * the *url's*: "" for a page with no extension, which is most of the web,
 * plus the ones that spell it out. Nothing else - an .mp3 or an .ical
 * link is not a page and gets no preview until a processor for it
 * exists. Exact matches only, by design; there is no wildcard.
 * @type {Votive.VotiveProcessor}
 */
const linkPreviewProcessor = {
  format: "url",
  extensions: ["", ".html", ".htm", ".php", ".asp", ".aspx"],
  readURL: parseLinkPreview
}

/** @type {Votive.VotivePlugin} */
const vowelURLsPlugin = {
  name: "vowel-urls",
  processors: [linkPreviewProcessor]
}

export default vowelURLsPlugin
export { parseLinkPreview, previewPath }
