import voot from "voot"
import { createConfig } from "./config.js"

/**
 * @param {object} options
 * @property {"verbose" | "essential" | "silent"} logging
 * @property {string} [sourceFolder] - defaults to the current working
 *   directory (see createConfig) - a caller with its own project folder
 *   (vowel-desktop, a future host) should always pass this explicitly.
 */
async function init(options = {}) {
  const { sourceFolder, ...overrides } = options
  const config = createConfig(sourceFolder, overrides)
  return voot(config)
}


export default init
