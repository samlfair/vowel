#!/usr/bin/env node

import fs from "node:fs/promises"
import { intro, note, text, select, confirm, spinner, outro, box } from "@clack/prompts"
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

/** @param {boolean} verbose */
async function removeCache(verbose) {
  try {
    await fs.rm(config.databasePath)
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "cache cleared")}`)
  } catch (e) {
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "no database cache found")}`)
  }
}

/** @param {boolean} verbose */
async function removeDB(verbose) {
  try {
    await fs.rm(config.targetFolder, { recursive: true, force: true })
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "output cleared")}`)
  } catch (e) {
    if (verbose) console.info(`${styleText("dim", "loading:")} ${styleText("green", "no output cache found")}`)
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

    await select({
      message: "Proceed",
      options: [
        {
          value: true,
          label: "OK"
        }]
    })

    box(`Vowel infers most relevant information from common markdown conventions, so it requires very little configuration.

The few configurations that Vowel uses live in a 'settings.md' file at the root of your project.`)




    const proceed = await confirm({
      message: "Generate settings file"
    })

    if (proceed) {
      const frontmatter = [`---`]

      box(`Change these configurations by editing 'settings.md'.`)

      const websiteTitle = await text({
        message: "Website title",
        placeholder: "My Cool Website"
      })

      frontmatter.push(`title: ${websiteTitle}`)

      const tagline = await text({
        message: "Website tagline (leave empty to skip)",
        placeholder: "All the news that's fit to blog"
      })

      if (tagline) {
        frontmatter.push(`tagline: ${tagline}`)
      }

      box(`Vowel comes loaded with themes. You can override these themes by writing styles in a 'styles.css' file at the root of your project.`)

      const theme = await select({
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
      })

      if (theme) {
        frontmatter.push(`theme: ${theme}`)
      }

      box(`To publish a sitemap and RSS feed, provide the domain that you plan to use.`)

      const domain = await text({
        message: "Domain",
        placeholder: "thebomb.com"
      })

      if (domain) {
        frontmatter.push(`domain: ${domain}`)
      }

      box(`To credit an author on your RSS feed, provide an author.`)

      const author = await text({
        message: "Author",
        placeholder: "George Constanza"
      })

      if (author) {
        frontmatter.push(`author: ${author}`)
      }

      box(`Markdown files are pages. Filenames are breadcrumbs. Folders are website sections. 'home.md' is your homepage.`)

      const homepage = await confirm({
        message: "Generate homepage"
      })

      const spin = spinner()

      spin.start('Setting up')

      frontmatter.push(`---`)

      const settings = frontmatter.join(`\n`)

      const settingsExists = await exists("settings.md")

      if (!settingsExists) {
        await fs.writeFile("settings.md", settings, "utf-8")
      }

      const homeExists = await exists("home.md")

      if (!homeExists) {
        await fs.writeFile("home.md", `# Home\n\nWelcome home!`, "utf-8")
      }

      spin.clear()

      await select({
        message: "Ready to go. Vowel will now launch your website.",
        options: [
          {
            value: true,
            label: "Let's go"
          }
        ]
      })


    }


  }
}


/**
 * Runs one registered command directly and exits - no dev server, no
 * wizard, no cache-wiping. Reuses the exact handler a live "Publish"
 * button would trigger over WS (see voot's runCommand/handleCommand) -
 * this is just the other invocation path for the same registered
 * function, meant for CI/automated use (e.g. `vowel --command deploy`).
 * @param {string} name
 * @param {string} [payloadJSON]
 */
async function runCLICommand(name, payloadJSON) {
  const { runCommand } = await import("voot")

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

  const dbExists = await exists(config.databasePath)

  await removeCache(args.logging === "verbose")
  await removeDB(args.logging === "verbose")
  await fs.mkdir(config.targetFolder, { recursive: true })

  if (!args.skip && !dbExists) {
    const loading = votive({ ...config, verbose: false })
    await wizard()
    await (loading)
  }


  init(args)
}


main()
