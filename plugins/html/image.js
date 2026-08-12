import { testURL, createImagePaths, imageSizes, imageExts } from "./../../utils.js"
import path from "node:path"
import { h } from 'hastscript'
import * as unpic from "unpic"

/** @import * as Votive from "votive" */

/**
 * @param {string} imagePath
 * @param {Votive.Database} database
 * @param {string} dependent
 * @param {string} alt
 * @param {boolean} [itemprop]
 */
function createDynamicImage(imagePath, database, dependent, alt, itemprop) {
  // TODO: Hardcode image height and width
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

      return h("picture", { itemprop: itemprop && "image" }, sources)
    }
  }

  if (!isImg) return

  const relativePath = imagePath.startsWith("/") ? path.relative("/", imagePath) : imagePath
  const image = database.target.getWithTrackers(relativePath, dependent)
  if (!image) return
  const formats = createImagePaths(image.abstract.sourcePath, "./", image.abstract.uuid)

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
      alt: isImg && alt
    })
  })

  return h("picture", { itemprop: itemprop && "image" }, sources)
}

export default createDynamicImage