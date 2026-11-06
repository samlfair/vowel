import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { builtinModules } from "node:module"
import { execFileSync } from "node:child_process"
import path from "node:path"

/**
 * What npm publishes has to run. vowel 0.7.7 didn't: its package.json
 * listed refractor and not lowlight, and its code still imported
 * lowlight, so every fresh install failed on its first import. This
 * walks the imports Node loads from the package's entry points, in the
 * file list `npm pack` would publish, and checks each one is a
 * published file, a dependency or a Node builtin.
 */

const root = path.join(import.meta.dirname, "..")
const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"))

/** The paths npm would publish, as `npm pack --dry-run` lists them. */
function publishedFiles() {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
  const [pack] = JSON.parse(output)
  return new Set(pack.files.map(file => file.path))
}

/**
 * Every module specifier a file imports statically, or dynamically with
 * a literal. Not a JSDoc type's `{import("hast").Root}`, which loads
 * nothing.
 */
function imports(file) {
  const text = readFileSync(path.join(root, file), "utf-8")
  const statements = [...text.matchAll(/^\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']|(?<![{|]\s*)\bimport\(\s*["']([^"']+)["']\s*\)/gm)]
  return statements.map(match => match[1] ?? match[2] ?? match[3])
}

/** `@scope/name/x` and `name/x` as the package they name. */
const packageName = (specifier) => specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/")

test("every import Node loads from the published package resolves", () => {
  const published = publishedFiles()
  const dependencies = new Set(Object.keys(manifest.dependencies ?? {}))
  const builtins = new Set(builtinModules)
  const entries = [manifest.main, manifest.bin].flatMap(entry => typeof entry === "string" ? [entry] : Object.values(entry ?? {}))
  const seen = new Set()
  const queue = [...entries]
  const problems = []

  while (queue.length) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    if (!published.has(file)) {
      problems.push(`${file} is imported but not published (package.json "files")`)
      continue
    }
    for (const specifier of imports(file)) {
      if (specifier.startsWith(".")) {
        queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)))
        continue
      }
      if (specifier.startsWith("node:") || builtins.has(specifier)) continue
      const name = packageName(specifier)
      if (!dependencies.has(name)) problems.push(`${file} imports ${name}, which isn't in dependencies`)
    }
  }

  assert.deepEqual(problems, [])
  assert.ok(seen.size > 20, `${seen.size} files walked`)
})

test("every page names Vowel and its version as its generator", async () => {
  const { mkdtemp, writeFile, readFile, rm } = await import("node:fs/promises")
  const { tmpdir } = await import("node:os")
  const { default: votive } = await import("votive")
  const { createConfig } = await import("../config.js")
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-generator-src-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-generator-sys-"))
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred
    await site.close()
    const html = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.ok(html.includes(`<meta name=generator content="Vowel ${manifest.version}">`), html.slice(0, 400))
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
