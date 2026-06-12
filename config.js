import vowelImagesPlugin from "./plugins/images/index.js"
import vowelStylesPlugin from "./plugins/styles/index.js"
import vowelMarkdownPlugin from "./plugins/markdown/index.js"
import vowelRobotsPlugin from "./plugins/robots/index.js"
import vowelXMLPlugin from "./plugins/xml/index.js"
import vowelVectorPlugin from "./plugins/vectors/index.js"
import vowelFontsPlugin from "./plugins/fonts/index.js"

/** @import {VotiveConfig} from "votive" */
export const config = {
  sourceFolder: ".",
  destinationFolder: "output",
  plugins: [
    vowelMarkdownPlugin,
    vowelImagesPlugin,
    vowelStylesPlugin,
    vowelRobotsPlugin,
    vowelXMLPlugin,
    vowelVectorPlugin,
    vowelFontsPlugin
  ]
}