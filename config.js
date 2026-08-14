import path from "node:path"
import { systemDirectoryFor } from "votive/internals"
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

const sourceFolder = "."

// Vowel targets non-developer end users (via whatever app embeds it),
// who could be confused by an `output`/.votive.db/.cache showing up in
// their project folder - keep all three in an OS-appropriate system
// directory instead, keyed per-project so multiple Vowel sites never
// collide. Override any of the three below if you want them back in
// the project directory (or somewhere else entirely).
const systemDirectory = systemDirectoryFor(sourceFolder)

export const config = {
  sourceFolder,
  destinationFolder: path.join(systemDirectory, "output"),
  databasePath: path.join(systemDirectory, ".votive.db"),
  cacheDirectory: path.join(systemDirectory, ".cache"),
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