import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { password as promptPassword, isCancel } from "@clack/prompts"
import votive from "votive"
import { passwordFile, resolvePDS, xrpc } from "./publish.js"

/**
 * `vowel --command atproto-password`: saves the account's app password
 * where `atproto-publish` looks for it (publish.js's `passwordFile`).
 *
 * Asked for with a masked prompt, so it never lands in shell history. With
 * no terminal to ask in - a Publish button, CI - it comes from the
 * payload, `{"password": "…"}`.
 *
 * With an `atproto_did` in the root settings.md, the password is checked
 * by logging in, and a password for another account, or none, is refused
 * before anything is written. Without one it is saved unchecked, and
 * said so. The file is readable by its owner only.
 *
 * @param {{ password?: string } | undefined} payload
 * @param {{ config: import("votive").VotiveConfig, notify: (message: object) => void }} context
 */
async function saveAppPassword(payload, { config, notify }) {
  const given = typeof payload?.password === "string" ? payload.password.trim() : ""
  const password = given || await askForPassword()

  const { did, pds: configuredPDS } = await account(config)
  const verified = typeof did === "string" && did !== ""
  if (verified) {
    const pds = typeof configuredPDS === "string" && configuredPDS ? configuredPDS : await resolvePDS(did)
    notify({ status: "progress", message: `Checking the password with ${pds}...` })
    const session = await xrpc(pds, "com.atproto.server.createSession", { body: { identifier: did, password } })
    if (session.did !== did) throw new Error(`atproto: that app password is for ${session.did}, not ${did}; nothing saved`)
  }

  const file = passwordFile(config.sourceFolder)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, password, { mode: 0o600 })

  const checked = verified ? `checked against ${did}` : "not checked: no atproto_did in settings.md"
  notify({ status: "done", message: `Saved the app password to ${file} (${checked})` })
  return { saved: file, verified }
}

/** The masked prompt, or an error saying what to pass instead. */
async function askForPassword() {
  if (!process.stdin.isTTY) {
    throw new Error("atproto: no terminal to ask in; pass the app password as {\"password\": \"…\"}")
  }
  const answer = await promptPassword({ message: "App password (from your Bluesky settings)" })
  if (isCancel(answer) || !answer.trim()) throw new Error("atproto: no app password given; nothing saved")
  return answer.trim()
}

/**
 * The root's `atproto_did` and `atproto_pds`, from a build of the site -
 * settings are the database's to resolve.
 * @param {import("votive").VotiveConfig} config
 */
async function account(config) {
  const site = await votive({ ...config, verbose: false })
  try {
    await site.build({ defer: false })
    const root = site.database.setting.getByFolder("")
    return { did: root.lastNonNull("fm_atproto_did"), pds: root.lastNonNull("fm_atproto_pds") }
  } finally {
    await site.close()
  }
}

export { saveAppPassword }
