import { testURL, createImagePaths, imageSizes, imageExts } from "./../../utils.js"
import path from "node:path"
import { h } from 'hastscript'
import * as unpic from "unpic"

/** @import * as Votive from "votive" */

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

      // The derivative paths in srcset are uuid-based, so the original asset
  // path cannot be recovered from them. Carried here rather than as a
  // <source>, which is a loading candidate a browser could select.
  return h("picture", { itemprop: itemprop && "image", "data-original": imagePath }, sources)
    }
  }

  if (!isImg) return

  // Lowercased: every vowel target path is (config.js's router), and
  // the author may well have typed the file's real name.
  const relativePath = (imagePath.startsWith("/") ? path.relative("/", imagePath) : imagePath).toLowerCase()
  const image = api.target(relativePath)
  if (!image) return
  const formats = createImagePaths(image.source, "./", image.metadata.uuid)

  // Intrinsic size, measured at read (plugins/images): the browser
  // reserves the right box before the bytes arrive, and the reset's
  // `img { height: auto }` keeps the ratio when the width is capped.
  const { width, height, dominant } = image.metadata

  const sources = formats.map((format, index) => {
    const isImg = index === formats.length - 1

    const sizes = format.map((size, index) => `/${size} ${imageSizes[index]}w`).join(", ")
    const type = "image/" + path.extname(format[0]).slice(1)
    return h(isImg ? "img" : "source", {
      type,
      srcset: sizes,
      loading: isImg && "lazy",
      src: isImg && "/" + format.at(-1),
      sizes: "100vw",
      width: isImg && width,
      height: isImg && height,
      alt: isImg && alt
    })
  })

  // The derivative paths in srcset are uuid-based, so the original asset
  // path cannot be recovered from them. Carried here rather than as a
  // <source>, which is a loading candidate a browser could select.
  // --dominant is the image's dominant colour, for a stylesheet to use
  // as the placeholder behind a lazy image (`picture { background:
  // var(--dominant) }`); nothing here decides that it should.
  return h("picture", {
    itemprop: itemprop && "image",
    "data-original": imagePath,
    style: dominant && `--dominant: ${dominant}`
  }, sources)
}

export default createDynamicImage