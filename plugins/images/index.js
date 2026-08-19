import { randomUUID } from "node:crypto"
import sharp from 'sharp'
import path from "node:path"
import {createImagePath, imageSizes, imageExts } from "./../../utils.js"

/** @import * as Votive from "votive" */


/** @type {Votive.ProcessorWrite} */
async function writeImage(target, settings, api, config) {
  const { uuid, sourcePath } = target.abstract

  const defaultFormat = path.extname(sourcePath)

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

  const images = imageSizes.flatMap(size => {
    [...imageExts, defaultFormat].map(ext => {
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

/** @type {Votive.ProcessorRead} */
function readImagePath(string) {
  const uuid =randomUUID()

  const data = {
    metadata: {},
    abstract: {
      sourcePath: string,
      uuid
    }
  }

  return data
}

/** @type {Votive.VotiveProcessor} */
const jpegLoader = {
  format: "buffer",
  extensions: [".jpeg", ".jpg", ".png", ".webp", ".gif"],
  readFile: readImagePath,
  writeFile: writeImage
}

/** @type {Votive.VotivePlugin} */
const vowelImagesPlugin = {
  name: "vowel-jpeg",
  processors: [jpegLoader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelImagesPlugin
