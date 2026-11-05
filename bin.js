#!/usr/bin/env node

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { intro, note, text, select, confirm, spinner, outro, box, isCancel, cancel } from "@clack/prompts"
import { parse } from "@bomb.sh/args"
import t from "@bomb.sh/tab"
import votive from "votive"
import { styleText } from "node:util"
import { createConfig } from "./config.js"

// The CLI's own boundary: cwd is the project folder by convention (you
// `cd` into your blog and run `vowel`), so "." is the right default here
// specifically - see createConfig's own doc comment.
const config = createConfig(".")

/** @param {number} ms */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import init from "./index.js"
import { shouldClear, normalizeDomain, wrongFolderWarning } from "./cli.js"

/**
 * A prompt's answer - or, when the author pressed Ctrl-C or Escape, a
 * clean exit. clack returns a cancel symbol instead of an answer, and
 * the wizard used to carry on with it until a template string threw
 * "Cannot convert a Symbol value to a string". Nothing has been written
 * at that point: the wizard writes its files last.
 * @template T
 * @param {T | symbol} value
 * @returns {T}
 */
function answer(value) {
  if (!isCancel(value)) return /** @type {T} */ (value)
  cancel("Setup cancelled. Nothing was written.")
  process.exit(0)
}

/**
 * Discards the build database. Only under --clear (alias --reset): an
 * ordinary launch is a warm start, reusing the database and the output,
 * so a second launch on an unchanged site has nothing to do. The wipe on
 * every launch was a development convenience, and it hid the on-disk
 * database path from the CLI entirely.
 * @param {boolean} verbose
 */
async function removeDatabase(verbose) {
  try {
    await fs.rm(config.databasePath)
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "database cleared")}`)
  } catch (e) {
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "no database found")}`)
  }
}

/**
 * Empties the buffer cache: an image's measurements and derivative list,
 * cached by votive so a warm start doesn't decode it again. Without
 * this, a reset still reused every image's old read. Only the `.json`
 * results go. The `cache-key` file stays, because votive empties a
 * folder that has no key, so removing it would discard the next
 * launch's fresh cache. URL fetches are not cached here.
 * @param {boolean} verbose
 */
async function removeBufferCache(verbose) {
  const entries = await fs.readdir(config.cacheDirectory).catch(() => [])
  const results = entries.filter(name => name.endsWith(".json"))
  await Promise.all(results.map(name => fs.rm(path.join(config.cacheDirectory, name), { force: true })))
  if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", results.length ? "buffer cache cleared" : "no buffer cache found")}`)
}

/** @param {boolean} verbose */
async function removeOutput(verbose) {
  try {
    await fs.rm(config.targetFolder, { recursive: true, force: true })
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "output cleared")}`)
  } catch (e) {
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "no output found")}`)
  }
}



async function exists(filePath) {
  try {
    await fs.stat(filePath)
    return true
  } catch (e) {
    return false
  }
}

async function wizard() {

  {
    box(`Welcome!\n\nVowel is a static blog generator. It bundles markdown into HTML.`)

    answer(await select({
      message: "Proceed",
      options: [
        {
          value: true,
          label: "OK"
        }]
    }))

    box(`Vowel infers most relevant information from common markdown conventions, so it requires very little configuration.

The few configurations that Vowel uses live in a 'settings.md' file at the root of your project.`)




    const proceed = answer(await confirm({
      message: "Generate settings file"
    }))

    if (proceed) {
      const frontmatter = [`---`]

      box(`Change these configurations by editing 'settings.md'.`)

      const websiteName = answer(await text({
        message: "Website name",
        placeholder: "My Cool Website"
      }))

      frontmatter.push(`name: ${websiteName}`)

      box(`Vowel comes loaded with themes. You can override these themes by writing styles in a 'styles.css' file at the root of your project.`)

      const theme = answer(await select({
        message: "Theme",
        options: [
          {
            value: 'default',
            label: 'Default',
            hint: 'full blog styling'
          },
          {
            value: 'typography',
            label: 'Typography',
            hint: 'sensible typographic presets'
          },
          {
            value: 'reset',
            label: 'Reset',
            hint: 'standard CSS reset'
          },
          {
            value: false,
            label: 'None',
            hint: 'write your own styles in `./styles.css`'
          }
        ]
      }))

      if (theme) {
        frontmatter.push(`theme: ${theme}`)
      }

      box(`To publish a sitemap and RSS feed, provide the domain that you plan to use.`)

      const domain = answer(await text({
        message: "Domain",
        placeholder: "thebomb.com"
      }))

      // As pasted from a browser: https://Example.com/ is example.com.
      const siteDomain = normalizeDomain(domain)

      if (siteDomain) {
        frontmatter.push(`domain: ${siteDomain}`)
      }

      box(`To credit an author on your RSS feed, provide an author.`)

      const author = answer(await text({
        message: "Author",
        placeholder: "George Constanza"
      }))

      if (author) {
        frontmatter.push(`author: ${author}`)
      }

      box(`Markdown files are pages. Filenames are breadcrumbs. Folders are website sections. 'home.md' is your homepage.`)

      const homepage = answer(await confirm({
        message: "Generate homepage"
      }))

      // A slogan is a page's; the homepage's is the site's hero. Only
      // asked for the homepage the wizard is about to write.
      const slogan = homepage ? answer(await text({
        message: "Homepage slogan (leave empty to skip)",
        placeholder: "All the news that's fit to blog"
      })) : undefined

      const spin = spinner()

      spin.start('Setting up')

      frontmatter.push(`---`)

      const settings = frontmatter.join(`\n`)

      const settingsExists = await exists("settings.md")

      if (!settingsExists) {
        await fs.writeFile("settings.md", settings, "utf-8")
      }

      const homeExists = await exists("home.md")

      if (homepage && !homeExists) {
        const homeFrontmatter = slogan ? `---\nslogan: ${slogan}\n---\n` : ""
        await fs.writeFile("home.md", `${homeFrontmatter}# Home\n\nWelcome home!`, "utf-8")
      }

      spin.clear()

      answer(await select({
        message: "Ready to go. Vowel will now launch your website.",
        options: [
          {
            value: true,
            label: "Let's go"
          }
        ]
      }))


    }


  }
}


/**
 * Runs one registered command directly and exits - no dev server, no
 * wizard, no cache-wiping. Reuses the exact handler a live "Publish"
 * button would trigger over WS (see votive's runCommand/handleCommand) -
 * this is just the other invocation path for the same registered
 * function, meant for CI/automated use (e.g. `vowel --command deploy`).
 * @param {string} name
 * @param {string} [payloadJSON]
 */
async function runCLICommand(name, payloadJSON) {
  const { runCommand } = await import("votive")

  let payload
  try {
    payload = payloadJSON ? JSON.parse(payloadJSON) : undefined
  } catch (e) {
    console.error(`--payload must be valid JSON: ${e.message}`)
    process.exitCode = 1
    return
  }

  try {
    const data = await runCommand(config, name, payload, message => {
      console.info(message?.message ?? message)
    })
    if (data !== undefined) console.info(JSON.stringify(data))
  } catch (e) {
    console.error(e?.message || e)
    process.exitCode = 1
  }
}

async function main() {
  const args = parse(process.argv.slice(2))

  if (args.command) {
    await runCLICommand(args.command, args.payload)
    return
  }

  // `vowel export <folder>` and `vowel check`: two commands spelled as
  // words rather than --command/--payload. Any other word is a mistake,
  // said so: it used to be ignored and start the preview, which never
  // exits - under CI, a job that hung until it timed out.
  const word = args._?.[0]
  if (word === "export") {
    await runCLICommand("export", JSON.stringify({ path: args._[1] }))
    return
  }
  if (word === "check") {
    await runCLICommand("check")
    return
  }
  if (word !== undefined) {
    console.error(`vowel: unknown command "${word}". The words are \`vowel export <folder>\` and \`vowel check\`; any other command is \`vowel --command <name>\`.`)
    process.exitCode = 1
    return
  }

  // A site is a folder with a settings.md; the wizard writes one. Not "no
  // database yet", which was also true of every site cloned onto a new
  // machine. And only with a terminal to ask in: under CI or a pipe the
  // prompts waited forever.
  const settingsExists = await exists("settings.md")
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)

  if (!settingsExists && interactive) {
    const entries = await fs.readdir(".")
    const folder = process.cwd()
    const warning = wrongFolderWarning(entries, { folder, home: folder === os.homedir() })
    if (warning && !answer(await confirm({ message: warning, initialValue: false }))) {
      cancel("Run vowel inside your site's folder, or in a new, empty one.")
      return
    }
  }

  if (shouldClear(args)) {
    await removeDatabase(args.logging === "verbose")
    await removeBufferCache(args.logging === "verbose")
    await removeOutput(args.logging === "verbose")
  }
  await fs.mkdir(config.targetFolder, { recursive: true })

  // The wizard runs for a new site only; --clear doesn't change that - a
  // cleared project is still one that was set up.
  if (!args.skip && !settingsExists && interactive) {
    // const loading = votive({ ...config, verbose: false })
    await wizard()
    // await (loading)
  }


  // `--editor` is deliberately undocumented: the in-page editor is not
  // part of 1.0. It reaches the html plugin as config.editor.
  init({ ...args, editor: Boolean(args.editor) })
}


main()
