import voot from "voot"
import { config } from "./config.js"

/**
 * @param {object} options
 * @property {"verbose" | "essential" | "silent"} logging
 */
async function init(options) {
  const cache = await voot({ ...config, ...options })
}


export default init

