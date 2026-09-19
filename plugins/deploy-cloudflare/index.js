import votive from "votive"
import { spawn } from "node:child_process"
import path from "node:path"

/**
 * Publishes a full build to Cloudflare Pages via `wrangler pages deploy`.
 *
 * Always runs a complete build first, regardless of whether a dev server
 * happens to already be running against this config - a command's
 * context (config, notify) has no reference to a live server's own build
 * queue, and this needs to behave identically whether triggered from the
 * CLI (no server at all, see votive's runCommand) or a live "Publish"
 * button over WS. Modest redundant cost when a dev server IS already
 * running (bundle() is cheap when nothing's stale), traded for one
 * deploy command that works the same everywhere.
 *
 * Shells out to `wrangler` rather than calling Cloudflare's REST API
 * directly - Pages deploys require content-hashing every asset and
 * building a manifest in Cloudflare's specific format, which wrangler
 * already implements and maintains. `wrangler` reads
 * CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID from the environment
 * natively; this never touches credentials itself, and none should ever
 * be added to `config` (it isn't a place secrets should live).
 *
 * @param {any} payload
 * @param {{ config: import("votive").VotiveConfig & { cloudflareProjectName?: string }, notify: (message: object) => void }} context
 */
async function deployToCloudflarePages(payload, { config, notify }) {
  // The Pages project, from the command's payload (`vowel --command
  // deploy --payload '{"projectName":"my-site"}'`, or a Publish button's
  // body) or from the config an embedder built.
  const projectName = payload?.projectName ?? config.cloudflareProjectName
  if (!projectName) throw new Error("a Cloudflare Pages project name is required to deploy: pass {\"projectName\": \"…\"} as the payload, or set config.cloudflareProjectName")

  notify({ status: "progress", message: "Building..." })

  // Unlike a dev server's own rebuilds, a deploy needs everything done -
  // there's no "next edit" to stay responsive for - so the deferred
  // work (image derivatives, link previews) is awaited, and the site is
  // closed: the database is a cache on disk, and this process is done
  // with it.
  const site = await votive({ ...config, verbose: false })
  await (await site.build()).deferred
  await site.close()

  notify({ status: "progress", message: `Publishing ${config.targetFolder} to Cloudflare Pages...` })

  return new Promise((resolve, reject) => {
    const proc = spawn(
      "wrangler",
      ["pages", "deploy", config.targetFolder, "--project-name", projectName],
      { stdio: ["ignore", "pipe", "pipe"] }
    )

    // Piped, not "inherit" - this can run with no terminal attached at
    // all (triggered over WS from a browser), so wrangler's own output
    // has to go through notify() to reach whoever's actually watching.
    proc.stdout.on("data", chunk => notify({ status: "progress", message: chunk.toString() }))
    proc.stderr.on("data", chunk => notify({ status: "progress", message: chunk.toString() }))

    proc.on("error", reject) // e.g. wrangler isn't installed
    proc.on("exit", code => {
      if (code === 0) resolve({ deployed: true })
      else reject(new Error(`wrangler exited with code ${code}`))
    })
  })
}

/**
 * In vowel's default plugin list (config.js), so `vowel --command
 * deploy` reaches it from any project. Registering a command costs
 * nothing until it is invoked, and invoking it needs a project name,
 * so a site that deploys elsewhere never meets it.
 * @type {import("votive").VotivePlugin}
 */
const vowelDeployCloudflarePlugin = {
  name: "vowel-deploy-cloudflare",
  commands: {
    deploy: deployToCloudflarePages
  }
}

export default vowelDeployCloudflarePlugin
