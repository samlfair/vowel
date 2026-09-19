import { hash as digest } from "node:crypto"
import path from "node:path"
import sharp from 'sharp'
import { createImagePath, imageSizes, imageExts } from "./../../utils.js"

/** @import * as Votive from "votive" */

const EXTENSIONS = [".jpeg", ".jpg", ".png", ".webp", ".gif", ".avif"]

/**
 * An image's derivatives - four widths in avif, webp and its own format
 * - are the image's **owned targets**: its read returns them (votive's
 * ReadHookResult.targets), each a recipe in metadata and nothing else.
 * Votive stores them with the image as their source, which is the whole
 * mechanism: at write, `target.buffer()` reads the owner's file, so a
 * derivative resizes from the original with nothing carried between
 * stages; and ownership decides their lifetime - a changed image (a new
 * hash, so new paths) replaces its set, a deleted image takes its
 * twelve with it, and a warm start finds rows for every file and does
 * nothing.
 *
 * They used to be written straight to disk by the original's write,
 * which only worked while every launch was a cold build: the startup
 * sweep deleted every unclaimed file on the second launch. A stub
 * version in between worked, but declared them two builds after the
 * read (an enumerator sees only the database) and needed a module-level
 * map to find the original at write, since a stub has no file behind
 * it. The read that has the bytes is the right place to say what they
 * become.
 */

/**
 * The two-byte hex of one channel.
 * @param {number} channel
 */
function hex(channel) {
  return Math.round(channel).toString(16).padStart(2, "0")
}

/**
 * Runs deferred, with the bytes (buffer format), so this is where an
 * image is looked at. Dimensions go on <img width height> so the browser
 * reserves the box before the bytes arrive; the dominant colour becomes
 * a custom property on the <picture> for a placeholder that matches; the
 * content hash names the derivatives, so they change exactly when the
 * pixels do. sharp decodes the image once here, and the result - the
 * derivative list included - is in the buffer cache after the first
 * read.
 * @type {Votive.ProcessorRead}
 */
async function readImagePath(source) {
  const buffer = source.buffer()
  const image = sharp(buffer)
  const [{ width, height }, { dominant }] = await Promise.all([image.metadata(), image.stats()])
  const dominantColor = dominant ? `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` : undefined
  const hash = digest("sha1", buffer).slice(0, 8)

  const ext = path.extname(source.target)
  const targets = imageSizes.flatMap(size => [...imageExts, ext].map(format => ({
    path: createImagePath({ targetFilePath: source.target, size, ext: format, targetDirectory: "", uuid: hash }),
    metadata: { derivative: { size, format: format.replace(/^\./, "") } }
  })))

  return { metadata: { hash, width, height, dominant: dominantColor }, targets }
}

/**
 * An original is copied through. A derivative is resized and converted
 * from its owner's bytes - which is what target.buffer() reads, because
 * votive stored the owner as the derivative's source.
 * @type {Votive.ProcessorWrite}
 */
async function writeImage(target) {
  const bytes = target.buffer()
  const recipe = target.metadata?.derivative
  if (!recipe) return { data: bytes }

  const format = recipe.format === "jpg" ? "jpeg" : recipe.format
  const data = await sharp(bytes).resize(recipe.size).toFormat(format).toBuffer()
  return { data }
}

/** @type {Votive.VotiveProcessor} */
const imagesProcessor = {
  format: "buffer",
  extensions: EXTENSIONS,
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: readImagePath,
  writeFile: writeImage
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-images",
  processors: [imagesProcessor]
}

export default vowelImagesPlugin
