import { statSync } from "node:fs"
import path from "node:path"

/** @import * as Votive from "votive" */

/**
 * Files the site publishes as they are: video, data and documents an
 * author links to from a page. Copied through byte for byte - like a
 * font - with one rule: **a file over the size limit is not published.**
 * Cloudflare Pages refuses any single file over 25 MiB, and a deploy
 * that fails on one video is worse than a build that says so up front.
 * The read (deferred, like every buffer read) stats the source rather
 * than reading it, logs one error naming the file and its size, and
 * makes the target virtual, so nothing lands on disk and nothing links
 * to it as though it were there. The limit is `config.assetSizeLimit`
 * in bytes for a host that allows more.
 *
 * Per Sam (Sept 19): copy through mp4 and csv, with a reasonable file
 * size limit. The list is what people link to from a page and expect
 * to be there; adding an extension is adding it here.
 */

const EXTENSIONS = [".mp4", ".webm", ".csv", ".json", ".pdf", ".ico"]

/** 25 MiB: Cloudflare Pages' per-file limit. */
const DEFAULT_SIZE_LIMIT = 25 * 1024 * 1024

/** @param {number} bytes */
const megabytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/** @param {Votive.VotiveConfig} config */
const sizeLimit = (config) => Number(config.assetSizeLimit) || DEFAULT_SIZE_LIMIT

/**
 * @type {Votive.ProcessorRead}
 */
function readAsset(source, { config }) {
  const { size } = statSync(path.join(config.sourceFolder, source.path))
  if (size <= sizeLimit(config)) return { metadata: { size } }
  return { metadata: { size, oversized: true }, write: false }
}

/**
 * An oversized file is reported here, not at its read: a buffer read
 * is cached, and a cached read never calls the hook again, so a check
 * on a warm cache (`vowel check`) would never have heard of it. Every
 * fresh build writes every target.
 * @type {Votive.ProcessorWrite}
 */
function writeAsset(target, { config }) {
  if (!target.metadata?.oversized) return { data: target.buffer() }
  config.log?.("error", `${target.source ?? target.path} is ${megabytes(target.metadata.size)}; files over ${megabytes(sizeLimit(config))} are not published (Cloudflare Pages refuses them). Host it elsewhere and link to it.`)
  return undefined
}

/** @type {Votive.VotiveProcessor} */
const assetsProcessor = {
  format: "buffer",
  extensions: EXTENSIONS,
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  readFile: readAsset,
  writeFile: writeAsset
}

/** @type {Votive.VotivePlugin} */
const vowelAssetsPlugin = {
  name: "vowel-assets",
  processors: [assetsProcessor]
}

export default vowelAssetsPlugin
export { EXTENSIONS, DEFAULT_SIZE_LIMIT }
