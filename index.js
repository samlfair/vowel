import { startServer } from "votive"
import { createConfig } from "./config.js"

/**
 * @param {object} options
 * @property {"verbose" | "essential" | "silent"} logging
 * @property {string} [sourceFolder] - defaults to the current working
 *   directory (see createConfig) - a caller with its own project folder
 *   (vowel-desktop, a future host) should always pass this explicitly.
 * @returns {Promise<{port: number, server: import("node:http").Server, close: () => Promise<void>}>}
 *   startServer's own return, passed through. `port` is the bound port, which can
 *   differ from the one requested; `close()` releases the watchers and the
 *   listener, which a host serving more than one project over a session
 *   needs before opening the next one.
 */
async function init(options = {}) {
  const { sourceFolder, ...overrides } = options
  const config = createConfig(sourceFolder, overrides)
  return startServer(config)
}


export default init
