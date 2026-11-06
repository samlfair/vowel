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
import { shouldClear, wrongFolderWarning, writeSite, hasInitAnswers, initProblem, defaultsNotes, nameFromFolder } from "./cli.js"

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

/**
 * The setup wizard's questions; it writes through writeSite() (cli.js),
 * as `vowel init` with flags does, so the two make the same files.
 * @param {{ launch?: boolean }} [options] - false for `vowel init`,
 *   which sets up and exits rather than starting the preview
 */
async function wizard({ launch = true } = {}) {

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
      box(`Change these configurations by editing 'settings.md'.`)

      // The folder's name, shown and editable before it is written.
      const websiteName = answer(await text({
        message: "Website name",
        initialValue: nameFromFolder(process.cwd(), os.homedir())
      }))

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

      box(`To publish a sitemap and RSS feed, provide the domain that you plan to use.`)

      const domain = answer(await text({
        message: "Domain",
        placeholder: "thebomb.com"
      }))

      box(`To credit an author on your RSS feed, provide an author.`)

      const author = answer(await text({
        message: "Author",
        placeholder: "George Constanza"
      }))

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

      box(`AI agents, such as Claude Code or Codex, can write and edit your site. Vowel can leave them notes on how it works: an 'AGENTS.md' file, which any agent reads, and the Vowel skill for Claude Code.`)

      const agentsFile = answer(await confirm({
        message: "Write AGENTS.md"
      }))

      const skill = answer(await confirm({
        message: "Add the Vowel skill to .claude/skills"
      }))

      const spin = spinner()

      spin.start('Setting up')

      const answers = {
        name: websiteName,
        theme,
        domain,
        author,
        home: homepage,
        slogan,
        agents: agentsFile,
        skill
      }
      const { written } = await writeSite(process.cwd(), answers)

      spin.clear()

      const notes = defaultsNotes(answers, written)
      if (notes.length) note(notes.join("\n"))

      if (!launch) {
        outro("Set up. Run `vowel` to preview the site, and `vowel check` to check it.")
        return
      }

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

/**
 * `vowel init`: sets up a site in this folder and exits, rather than
 * starting the preview. With flags, which answer the wizard's questions
 * one each, it asks nothing, so an agent can make a site in one command;
 * with none, in a terminal, it runs the wizard. Nothing that exists is
 * replaced. A home folder, or a folder of other things, is refused
 * without a terminal to ask in, unless `--force`.
 * @param {Record<string, unknown>} args
 */
async function runInit(args) {
  const problem = initProblem(args)
  if (problem) {
    console.error(problem)
    process.exitCode = 1
    return
  }

  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  const asking = interactive && !hasInitAnswers(args)
  const folder = process.cwd()

  if (!args.force && !(await exists("settings.md"))) {
    const entries = await fs.readdir(".")
    const warning = wrongFolderWarning(entries, { folder, home: folder === os.homedir() })
    if (warning && !asking) {
      console.error(`vowel init: ${warning.replace(/ Set up a site here anyway\?$/, "")} Pass --force to set up a site here anyway.`)
      process.exitCode = 1
      return
    }
    if (warning && !answer(await confirm({ message: warning, initialValue: false }))) {
      cancel("Run vowel init inside a new, empty folder, or in your markdown's folder.")
      return
    }
  }

  if (asking) {
    await wizard({ launch: false })
    return
  }

  const on = (value) => value === true || value === "true"
  const answers = {
    name: args.name,
    theme: args.theme,
    domain: args.domain,
    author: args.author,
    slogan: args.slogan,
    home: !(args.home === false || args.home === "false"),
    agents: on(args.agents),
    skill: on(args.skill)
  }
  const { written, kept } = await writeSite(folder, answers)
  if (written.length) console.info(`Wrote ${written.join(", ")}.`)
  if (kept.length) console.info(`Kept ${kept.join(", ")}, which already existed.`)
  defaultsNotes(answers, written).forEach(line => console.info(line))
  console.info("Run `vowel` to preview the site, and `vowel check` to check it.")
}

async function main() {
  const args = parse(process.argv.slice(2))

  if (args.command) {
    await runCLICommand(args.command, args.payload)
    return
  }

  // `vowel export <folder>`, `vowel check` and `vowel init`: commands
  // spelled as words rather than --command/--payload. Any other word is a mistake,
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
  if (word === "init") {
    await runInit(args)
    return
  }
  if (word !== undefined) {
    console.error(`vowel: unknown command "${word}". The words are \`vowel init\`, \`vowel export <folder>\` and \`vowel check\`; any other command is \`vowel --command <name>\`.`)
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
