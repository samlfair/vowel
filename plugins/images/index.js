import { hash as digest } from "node:crypto"
import { readFileSync } from "node:fs"
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
 * A blurry stand-in for the image while it loads, inlined in the page:
 * 16 px on its long side, low-quality WebP, a data URI of roughly
 * 150-300 bytes. The browser smooths it as it scales up. Done here
 * rather than with lqip-modern, which wraps these same sharp calls.
 * @param {import("sharp").Sharp} image
 */
async function placeholderURI(image) {
  const bytes = await image.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 20 }).toBuffer()
  return `data:image/webp;base64,${bytes.toString("base64")}`
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
  const [{ width, height, hasAlpha }, { dominant }] = await Promise.all([image.metadata(), image.stats()])
  const dominantColor = dominant ? `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` : undefined
  // Not behind an image with transparency: the page has no script to take
  // it away once the image loads, so it would show through.
  const placeholder = hasAlpha ? undefined : await placeholderURI(image)
  const hash = digest("sha1", buffer).slice(0, 8)

  const ext = path.extname(source.target)
  const formats = [...imageExts, ext.replace(/^\./, "")]
  const targets = formats.flatMap(format => imageSizes.map(size => ({
    path: createImagePath({ targetFilePath: source.target, size, ext: format, targetDirectory: "", uuid: hash }),
    metadata: { derivative: { size, format } }
  })))
  const metadata = { hash, width, height, dominant: dominantColor, placeholder }

  if (!isOptimized(source)) return { metadata, targets }

  // Grouped by format in <picture> order (avif, webp, its own), each
  // smallest first. This list is the one place a derivative's path is
  // decided: plugins/html/image.js links what it names.
  const derivatives = targets.map(({ path, metadata }) => ({ path, ...metadata.derivative }))
  return { metadata: { ...metadata, derivatives }, targets, write: false }
}

/**
 * A png or jpeg is never published at full size: its derivatives are
 * linked everywhere instead, and the original is a virtual target. The
 * root favicon.png is exempt, because it is linked as it is, as the
 * site's icon. The other formats are copied through as before; their
 * derivatives are made but nothing links them yet.
 * @param {{ path: string, target: string }} source
 */
function isOptimized(source) {
  if (source.path === "favicon.png") return false
  return /^\.(png|jpe?g)$/.test(path.extname(source.target))
}

/**
 * A derivative is resized and converted from its owner's bytes - which
 * is what target.buffer() reads, because votive stored the owner as the
 * derivative's source. An original with derivatives is virtual and
 * writes nothing; any other original is copied through.
 * @type {Votive.ProcessorWrite}
 */
async function writeImage(target) {
  // The placeholder favicon has no file to read; its bytes are its data.
  if (target.metadata?.favicon) return { data: Buffer.from(target.data, "base64") }
  if (target.metadata?.derivatives) return

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

/**
 * Every site has Vowel's mark as a placeholder favicon,
 * `favicon-placeholder.png`, published always and linked only when the
 * site has no `icon` and no `favicon.png` of its own (the html plugin).
 * A stub of its own source type (`.favicon`, which nothing else uses)
 * read as base64 text, so it is read with the pages rather than with
 * the images in the background. A write is matched on the target's
 * extension, so writeImage writes it, from that text.
 * @type {Votive.VotiveProcessor}
 */
const faviconProcessor = {
  extensions: [".favicon"],
  format: "text",
  router: ({ name, dir }) => ({ name, dir, ext: ".png" }),
  createStubs: () => [{ path: "favicon-placeholder.favicon" }],
  expandStubs: () => ({ text: readFileSync(path.join(import.meta.dirname, "favicon.png")).toString("base64") }),
  readFile: (source) => ({ data: source.text, metadata: { favicon: true } })
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-images",
  processors: [imagesProcessor, faviconProcessor]
}

export default vowelImagesPlugin
