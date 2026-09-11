import { randomUUID } from "node:crypto"
import sharp from 'sharp'
import path from "node:path"
import {createImagePath, imageSizes, imageExts } from "./../../utils.js"

/** @import * as Votive from "votive" */


/** @type {Votive.ProcessorWrite} */
async function writeImage(target, { settings, config }) {
  const { uuid } = target.metadata

  // target.source is the same project-relative path the abstract used to
  // duplicate as `sourcePath`.
  const defaultFormat = path.extname(target.source)

  // target.path is the routed *target* path (relative to targetFolder,
  // e.g. for writing/routing) - never a real, readable filesystem path,
  // and never was: sharp(target.path)/fs.readFile(target.path) only
  // "worked" by coincidence when cwd happened to equal sourceFolder and
  // an image's target path happened to match its source filename. The
  // real source bytes are target.buffer() (see assetHelpers.js), which
  // resolves target.source against config.sourceFolder correctly
  // regardless of cwd or where target.path routed to.
  const buffer = target.buffer()
  const image = sharp(buffer)

  // `return` matters: without it flatMap collected undefined per size,
  // Promise.all below resolved at once, and every sharp write was
  // fire-and-forget - finishing after the build reported done, after
  // close(), and potentially after deploy had already handed the folder
  // to wrangler.
  const images = imageSizes.flatMap(size => {
    return [...imageExts, defaultFormat].map(ext => {
      // target.path (routed, relative to targetFolder) here too - the
      // resized variants belong alongside where this image's target
      // itself routed to, not mirrored under its absolute source
      // location (which is what sourcePath would produce once joined
      // with targetDirectory - an absolute path glued onto another
      // absolute path, never a valid write location).
      const filePath = createImagePath({
        targetFilePath: target.path,
        size,
        ext,
        targetDirectory: config.targetFolder,
        uuid
      })

      return image.clone().resize(size).toFile(filePath)
    })
  })

  await Promise.all(images)

  return {
    data: buffer,
  }
}

/**
 * The two-byte hex of one channel.
 * @param {number} channel
 */
function hex(channel) {
  return Math.round(channel).toString(16).padStart(2, "0")
}

/**
 * Runs deferred, with the bytes (buffer format), so this is where the
 * image is actually looked at. Dimensions go on <img width height> so
 * the browser reserves the box before the bytes arrive; the dominant
 * colour becomes a custom property on the <picture> for a placeholder
 * that matches. sharp's stats() decodes the image once for the colour;
 * the derivatives decode it again at write time, and the result is in
 * the buffer cache after the first read, so it costs one decode per
 * image per project.
 * @type {Votive.ProcessorRead}
 */
async function readImagePath(source) {
  const uuid = randomUUID()
  const image = sharp(source.buffer())

  const [{ width, height }, { dominant }] = await Promise.all([image.metadata(), image.stats()])
  const dominantColor = dominant ? `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` : undefined

  // sourcePath is redundant with target.source, which carries the same
  // project-relative path.
  return { metadata: { uuid, width, height, dominant: dominantColor } }
}

/** @type {Votive.VotiveProcessor} */
const jpegLoader = {
  format: "buffer",
  extensions: [".jpeg", ".jpg", ".png", ".webp", ".gif"],
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: readImagePath,
  writeFile: writeImage
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-jpeg",
  processors: [jpegLoader]
}

export default vowelImagesPlugin
