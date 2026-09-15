/**
 * Decisions the CLI makes from its arguments, kept out of bin.js so they
 * can be tested without launching a server.
 */

/**
 * Whether this launch starts cold. `--clear` and `--reset` are the same
 * flag; anything else is a warm start that reuses the database and the
 * output, so a second launch on an unchanged site has nothing to do.
 * The wipe on every launch was a development convenience.
 * @param {Record<string, unknown>} args - as @bomb.sh/args parses them
 */
export function shouldClear(args) {
  return Boolean(args?.clear || args?.reset)
}
