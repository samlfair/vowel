import { readFileSync } from "node:fs"

/**
 * This vowel's version, from its package.json: the build cache's key
 * (config.js) and the pages' `<meta name=generator>`. A module of its
 * own because config.js imports the plugins, so a plugin can't import
 * config.js.
 */
export const VOWEL_VERSION = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version
