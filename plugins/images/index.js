import { randomUUID } from "node:crypto"
import fs from "fs/promises"
import sharp from 'sharp'
import path from "node:path"
import {createImagePath, imageSizes, imageExts } from "./../../utils.js"

/** @import * as Votive from "votive" */


/** @type {Votive.ProcessorWrite} */
async function writeImage(destination, database, config) {
  const { uuid, sourcePath } = destination.abstract

  const defaultFormat = path.extname(sourcePath)

  const image = sharp(destination.path)

  const images = imageSizes.flatMap(size => {
    [...imageExts, defaultFormat].map(ext => {
      const filePath = createImagePath({
        targetFilePath: sourcePath,
        size,
        ext,
        targetDirectory: config.destinationFolder,
        uuid
      })

      return image.clone().resize(size).toFile(filePath)
    })
  })

  await Promise.all(images)

  const buffer = await fs.readFile(destination.path)

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
