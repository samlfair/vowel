import voot from "voot"
import vowelImagesPlugin from "./plugins/images/index.js"
import vowelStylesPlugin from "./plugins/styles/index.js"
import vowelMarkdownPlugin from "./plugins/markdown/index.js"
import vowelRobotsPlugin from "./plugins/robots/index.js"
import vowelXMLPlugin from "./plugins/xml/index.js"
import vowelVectorPlugin from "./plugins/vectors/index.js"
import fs from "fs/promises"
import { styleText } from "node:util"


async function removeCache() {
  try {
    await fs.rm("./.votive.db")
    console.info(styleText("yellow", "Cache cleared"))
  } catch (e) {
    console.info(styleText("yellow", "No database cache found"))
  }
}

async function removeDB() {
  try {
    await fs.rmdir("./output")
    console.info(styleText("yellow", "Output cleared"))
  } catch (e) {
    console.info(styleText("yellow", "No output cache found"))
  }
}

await removeCache()
await removeDB()

/** @import {VotiveConfig} from "votive" */
const config = {
  sourceFolder: ".",
  destinationFolder: "output",
  plugins: [
    vowelMarkdownPlugin,
    vowelImagesPlugin,
    vowelStylesPlugin,
    vowelRobotsPlugin,
    vowelXMLPlugin,
    vowelVectorPlugin
  ]
}


async function init() {
  const then = performance.now()
  // await fs.rm(config.destinationFolder, { recursive: true, force: true })
  // await fs.mkdir(config.destinationFolder, { recursive: true })
  const cache = await voot(config)
  console.info(styleText("red", (performance.now() - then).toFixed(4) + "ms"))
}


export default init

