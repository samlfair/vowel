import { hash as digest } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import sharp from 'sharp'
import { createImagePath, imageSizes, imageExts } from "./../../utils.js"

/** @import * as Votive from "votive" */

const EXTENSIONS = [".jpeg", ".jpg", ".png", ".webp", ".gif", ".avif"]

/**
 * The derivatives - every image at four widths in avif, webp and its own
 * format - are **stubs**, declared here from the images that have been
 * read, one per (image, width, format), with the image's content hash
 * in the name.
 *
 * They used to be written straight to disk by the original's writeFile.
 * That worked only while every launch was a cold build: on a warm start
 * (the default since c8075db) the startup sweep deletes every output
 * file no row claims, the original is not stale so its write never runs
 * again, and every page's srcset points at files that are gone. As
 * stubs they have rows, so the sweep keeps them; the original changing
 * (a new hash) undeclares the old set and declares a new one, so stale
 * derivatives go instead of lingering; deleting the image takes its
 * twelve with it; and a warm start does nothing for images at all.
 *
 * The hash replaces a uuid minted at every read, which restaled every
 * page using the image on every re-read for no reason.
 *
 * `declared` is what this pass's enumerator listed, by stub path -
 * what readFile uses to tell a derivative from an original without
 * touching the filesystem, and what writeFile uses to find the original
 * and the size to derive. Refreshed at the top of every pass; the reads
 * are deferred and the writes come after, so it is always current.
 * @type {Map<string, {source: string, hash: string, size: number, ext: string}>}
 */
const declared = new Map()

/** @param {{path: string, source?: string | null, metadata?: any, extension?: string}} target */
const isOriginal = (target) => Boolean(target.source && target.metadata?.hash && !target.metadata?.derivative)

/** @type {Votive.ProcessorStubs} */
function createStubs({ api }) {
  declared.clear()
  const originals = api.targets({ folder: "", recursive: true })
    .filter(target => EXTENSIONS.includes(target.extension) && isOriginal(target))

  for (const original of originals) {
    const ext = path.extname(original.path)
    for (const size of imageSizes) {
      for (const format of [...imageExts, ext]) {
        const stubPath = createImagePath({ targetFilePath: original.path, size, ext: format, targetDirectory: "", uuid: original.metadata.hash })
        declared.set(stubPath, { source: original.source, hash: original.metadata.hash, size, ext: format })
      }
    }
  }

  return [...declared].map(([stubPath, params]) => ({ path: stubPath, params }))
}

/**
 * A derivative's bytes are produced at write, from the original; the
 * read only records what it is. So the expansion is a placeholder -
 * readFile below never decodes it.
 * @type {Votive.ProcessorExpand}
 */
function expandStubs() {
  return { buffer: Buffer.alloc(0) }
}

/**
 * The two-byte hex of one channel.
 * @param {number} channel
 */
function hex(channel) {
  return Math.round(channel).toString(16).padStart(2, "0")
}

/**
 * Runs deferred, with the bytes (buffer format), so this is where an
 * original is actually looked at. Dimensions go on <img width height> so
 * the browser reserves the box before the bytes arrive; the dominant
 * colour becomes a custom property on the <picture> for a placeholder
 * that matches; the content hash names the derivatives. sharp decodes
 * the image once here, and the result is in the buffer cache after the
 * first read.
 *
 * A derivative is recorded as one and not decoded: its bytes come from
 * the original at write time.
 * @type {Votive.ProcessorRead}
 */
async function readImagePath(source) {
  if (declared.has(source.path)) return { metadata: { derivative: true } }

  const buffer = source.buffer()
  const image = sharp(buffer)
  const [{ width, height }, { dominant }] = await Promise.all([image.metadata(), image.stats()])
  const dominantColor = dominant ? `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` : undefined
  const hash = digest("sha1", buffer).slice(0, 8)

  return { metadata: { hash, width, height, dominant: dominantColor } }
}

/**
 * An original is copied through. A derivative is resized and converted
 * from the original's bytes - read from the project, since a stub has
 * no file of its own - to the width and format its params name.
 * @type {Votive.ProcessorWrite}
 */
async function writeImage(target, { config }) {
  const params = declared.get(target.path)
  if (!params) return { data: target.buffer() }

  const original = await readFile(path.join(config.sourceFolder, params.source))
  const format = params.ext.replace(/^\./, "").replace(/^jpg$/, "jpeg")
  const data = await sharp(original).resize(params.size).toFormat(format).toBuffer()
  return { data }
}

/** @type {Votive.VotiveProcessor} */
const imagesProcessor = {
  format: "buffer",
  extensions: EXTENSIONS,
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  createStubs,
  expandStubs,
  readFile: readImagePath,
  writeFile: writeImage
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-images",
  processors: [imagesProcessor]
}

export default vowelImagesPlugin
