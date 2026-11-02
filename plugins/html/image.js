import { testURL, imageSizes, imageExts } from "./../../utils.js"
import path from "node:path"
import { h } from 'hastscript'
import * as unpic from "unpic"

/** @import * as Votive from "votive" */

/**
 * The image target a path names, from the root. Lowercased: every vowel
 * target path is (config.js's router), and the author may well have
 * typed the file's real name.
 * @param {string} imagePath
 * @param {import("votive").PluginAPI} api
 */
function findImage(imagePath, api) {
  const relativePath = (imagePath.startsWith("/") ? path.relative("/", imagePath) : imagePath).toLowerCase()
  return api.target(relativePath)
}

/**
 * The derivative to link where one file goes rather than a srcset: in
 * the image's own format, at `size` (one of imageSizes). Undefined for
 * an image without derivatives (plugins/images: a format that isn't
 * optimised, the root favicon.png, or an image not read yet).
 * @param {any} image - the image's target
 * @param {number} size
 */
function derivativeURL(image, size) {
  const format = path.extname(image.path).slice(1)
  const derivative = image.metadata?.derivatives?.find(entry => entry.format === format && entry.size === size)
  if (!derivative) return
  return "/" + derivative.path
}

/**
 * The url to put where an image path goes as one file - og:image, the
 * logo, an icon. A png or jpeg is not published at full size
 * (plugins/images), so the path names a derivative; anything else, an
 * external url included, is returned as it is. A tracked read, so the
 * page is rewritten when the image is read or changes.
 * @param {string | undefined} imagePath - from the root
 * @param {import("votive").PluginAPI} api
 * @param {number} size - one of imageSizes
 */
function imageURL(imagePath, api, size) {
  if (!imagePath || testURL(imagePath) || !/\.(png|jpe?g)$/i.test(imagePath)) return imagePath
  const image = findImage(imagePath, api)
  if (!image) return imagePath
  return derivativeURL(image, size) ?? imagePath
}

/**
 * The page image's dominant colour as a style for the element that
 * holds it - a page's <main>, a card's <article> - so CSS outside the
 * image can use it (text that contrasts with it, say). The <picture>
 * carries it too, for its own placeholder. Nothing here decides that
 * anything should use it. Undefined for no image, an external one, or
 * one not read yet.
 * @param {string | undefined} imagePath - from the root
 * @param {import("votive").PluginAPI} api
 */
function dominantStyle(imagePath, api) {
  if (!imagePath || testURL(imagePath)) return
  const dominant = findImage(imagePath, api)?.metadata.dominant
  if (!dominant) return
  return `--color-image-dominant: ${dominant}`
}

/**
 * @param {string} imagePath
 * @param {import("votive").PluginAPI} api
 * @param {string} alt
 * @param {boolean} [itemprop]
 */
function createDynamicImage(imagePath, api, alt, itemprop) {
  const parsed = path.parse(imagePath);
  const isURL = testURL(imagePath)
  const isImg = !parsed.ext.search(/^.(png|jpeg|jpg)$/);

  if (isURL) {
    const parsedImageURL = unpic.parseUrl(imagePath)
    if (parsedImageURL) {

      const sources = [...imageExts, "jpeg"].map((format, index) => {

        const isImg = index === imageExts.length
        // TODO: Ignore images that have options already specified
        const urls = imageSizes.map(size => {
          return unpic.transformUrl({
            format: format,
            url: parsedImageURL.src,
            provider: parsedImageURL.cdn,
            width: size
          })
        })

        const sizes = urls.map((url, index) => `${url} ${imageSizes[index]}w`).join(", ")

        return h(isImg ? "img" : "source", {
          type: "image/" + format,
          srcset: sizes,
          src: isImg && urls.at(-1),
          loading: isImg && "lazy",
          sizes: "100vw",
          alt: isImg && alt
        })
      })

      // The derivative paths in srcset are hash-based, so the original asset
  // path cannot be recovered from them. Carried here rather than as a
  // <source>, which is a loading candidate a browser could select.
  return h("picture", { itemprop: itemprop && "image", "data-original": imagePath }, sources)
    }
  }

  if (!isImg) return

  const image = findImage(imagePath, api)
  if (!image) return
  // An image without derivatives is published as it is (the root
  // favicon.png), and a plain <img> links it. The tracked read of
  // `derivatives` rewrites this page if they arrive.
  const { derivatives } = image.metadata
  if (!derivatives) return h("img", { src: "/" + image.path, alt, loading: "lazy" })
  // One group per format, in the order the read lists them, which is
  // <picture> order: avif, webp, then the image's own format as the <img>.
  const formats = [...new Set(derivatives.map(entry => entry.format))]
    .map(format => derivatives.filter(entry => entry.format === format))

  // Intrinsic size, measured at read (plugins/images): the browser
  // reserves the right box before the bytes arrive, and the reset's
  // `img { height: auto }` keeps the ratio when the width is capped.
  const { width, height, dominant, placeholder } = image.metadata

  const sources = formats.map((format, index) => {
    const isImg = index === formats.length - 1

    const sizes = format.map(entry => `/${entry.path} ${entry.size}w`).join(", ")
    const type = "image/" + format[0].format
    return h(isImg ? "img" : "source", {
      type,
      srcset: sizes,
      loading: isImg && "lazy",
      src: isImg && "/" + format.at(-1).path,
      sizes: "100vw",
      width: isImg && width,
      height: isImg && height,
      alt: isImg && alt
    })
  })

  // The derivative paths in srcset are hash-based, so the original asset
  // path cannot be recovered from them. Carried here rather than as a
  // <source>, which is a loading candidate a browser could select.
  // Two values for a stylesheet to show behind the image while it loads:
  // its dominant colour, and a tiny blurry copy (plugins/images; none
  // for an image with transparency). Nothing here decides that it should.
  const style = [
    dominant && `--color-image-dominant: ${dominant}`,
    // Unquoted: base64 has no character url() needs quoted, and the
    // minifier would spell each quote as `&#34`.
    placeholder && `--url-image-placeholder: url(${placeholder})`
  ].filter(Boolean).join("; ")
  return h("picture", {
    itemprop: itemprop && "image",
    "data-original": imagePath,
    style: style || undefined
  }, sources)
}

export { dominantStyle, imageURL, derivativeURL }
export default createDynamicImage