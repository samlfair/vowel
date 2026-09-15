import path from "node:path"
import { resolveProjectFolder } from "votive"
import { systemDirectoryFor } from "./systemPaths.js"
import { secretRouter } from "./secretPaths.js"
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

const defaultPlugins = [
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

/**
 * Builds a real config for a given project folder - a function, not a
 * module-level constant, because the folder isn't known until a caller
 * supplies one. The old shape (a static `export const config` built from
 * a hardcoded `sourceFolder = "."`) only worked for the CLI, where cwd
 * genuinely is the project folder; an embedder (vowel-desktop, a future
 * host) has its own folder that has nothing to do with cwd, and needs
 * its own targetFolder/databasePath/cacheDirectory to follow it - not a
 * value baked in at `import vowel from "vowel"` time. See
 * tasks/desktop-app-architecture.md.
 *
 * Vowel targets non-developer end users (via whatever app embeds it),
 * who could be confused by an `output`/.votive.db/.cache showing up in
 * their project folder - keep all three in an OS-appropriate system
 * directory instead, keyed per-project so multiple Vowel sites never
 * collide.
 *
 * `overrides.plugins`, if given, is *added* to vowel's default plugin
 * list rather than replacing it - an embedder registering its own
 * native-only commands (a folder picker, "reveal in Finder") shouldn't
 * have to reimplement markdown/html/images/etc. support just to add one
 * plugin. Override any of targetFolder/databasePath/cacheDirectory via
 * `overrides` directly if you want them back in the project directory
 * (or somewhere else entirely).
 * @param {string} [sourceFolder] - defaults to the current working
 *   directory, correct for the CLI. An embedder should always pass an
 *   explicit, real folder (e.g. from a native folder-picker) - cwd has
 *   no meaningful relationship to "the user's project" there.
 * @param {Partial<VotiveConfig> & { plugins?: VotiveConfig["plugins"] }} [overrides]
 * @returns {VotiveConfig}
 */
function createConfig(sourceFolder = ".", overrides = {}) {
  const resolvedSourceFolder = resolveProjectFolder(sourceFolder)
  const systemDirectory = systemDirectoryFor(resolvedSourceFolder)
  const { plugins: extraPlugins, ...rest } = overrides

  return {
    sourceFolder: resolvedSourceFolder,
    // Applied before every processor's own router, so a secret folder
    // hides its images and fonts too - not just its pages. See
    // secretPaths.js for why this cannot live in a processor.
    router: secretRouter,
    // Fetched link previews live in the project, one YAML file per host,
    // so they survive a cache wipe, travel with the project, and reach
    // coworkers through the repo. Visible rather than votive's hidden
    // default, because the author is meant to find and edit them: the
    // file is what the site shows. `$` keeps it out of routing, and
    // votive keeps it out of the source scan.
    urlStore: path.join(resolvedSourceFolder, "$links"),
    targetFolder: path.join(systemDirectory, "output"),
    databasePath: path.join(systemDirectory, ".votive.db"),
    cacheDirectory: path.join(systemDirectory, ".cache"),
    plugins: [...defaultPlugins, ...(extraPlugins ?? [])],
    ...rest
  }
}

export { createConfig }
