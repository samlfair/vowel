import { createHash } from "node:crypto"
import os from "node:os"
import path from "node:path"

/**
 * The OS-appropriate root for per-application data (not votive-specific
 * yet - see systemDirectoryFor). Follows the XDG Base Directory spec on
 * Linux/other POSIX systems, and each platform's own convention
 * elsewhere - the same rough convention tools like npm/eslint follow
 * for their own caches.
 * @returns {string}
 */
function systemDataRoot() {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support")
  }
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")
  }
  return process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
}

/**
 * Computes a per-project system directory, so Vowel doesn't write
 * `.votive.db`, a buffer cache, or its build output into a project
 * folder a non-developer end user might be confused by. Keyed by a hash
 * of the resolved `sourceFolder` path, so two projects never collide
 * without a manually-assigned project name.
 *
 * Vowel's own concern, not votive's: votive takes whatever
 * `databasePath`/`cacheDirectory`/`targetFolder` a config gives it and
 * falls back to project-relative defaults otherwise. (It lived in votive
 * and was exported from there once; nothing in votive ever called it.)
 * The `sourceFolder` must already be resolved - `resolveProjectFolder`
 * from votive, whose realpath step is what keeps the same folder reached
 * through a symlink from hashing to a second directory; config.js does
 * the two in that order. The `votive` path segment is kept as it was so
 * existing system directories stay where they are.
 * @param {string} sourceFolder
 * @returns {string}
 */
function systemDirectoryFor(sourceFolder) {
  const key = createHash("sha1").update(path.resolve(sourceFolder)).digest("hex").slice(0, 16)
  const root = systemDataRoot()
  return path.join(root, "votive", key)
}

export { systemDirectoryFor }
