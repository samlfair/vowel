import vowelImagesPlugin from "./plugins/images/index.js"
import vowelStylesPlugin from "./plugins/styles/index.js"
import vowelReadMarkdownPlugin from "./plugins/markdown/index.js"
import vowelWriteRobotsPlugin from "./plugins/robots/index.js"
import vowelWriteXMLPlugin from "./plugins/xml/index.js"
import vowelVectorPlugin from "./plugins/vectors/index.js"
import vowelFontsPlugin from "./plugins/fonts/index.js"
import vowelWriteHTMLPlugin from "./plugins/html/index.js"
import vowelURLsPlugin from "./plugins/urls/index.js"

/** @import {VotiveConfig} from "votive" */
export const config = {
  sourceFolder: ".",
  destinationFolder: "output",
  plugins: [
    vowelReadMarkdownPlugin,
    vowelImagesPlugin,
    vowelStylesPlugin,
    vowelWriteRobotsPlugin,
    vowelWriteXMLPlugin,
    vowelVectorPlugin,
    vowelFontsPlugin,
    vowelURLsPlugin,
    vowelWriteHTMLPlugin
  ]
}