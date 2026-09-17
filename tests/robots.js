import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import generateRobots from "../plugins/robots/robots.js"
import { groups } from "../plugins/robots/agents.js"

const blocks = (text) => Object.fromEntries(
  text.split("\n\n")
    .filter(block => block.startsWith("User-agent:"))
    .map(block => block.split("\n"))
    .map(([agent, rule]) => [agent.replace("User-agent: ", ""), rule])
)

test("generateRobots: the default keeps AI and image crawlers out and says nothing about search", () => {
  const rules = blocks(generateRobots())
  for (const agent of groups.ai) assert.equal(rules[agent], "Disallow: /", agent)
  for (const agent of groups.images) assert.equal(rules[agent], "Disallow: /", agent)
  for (const agent of groups.search) assert.equal(rules[agent], undefined, agent)
  assert.equal(rules["*"], undefined)
  assert.ok(!generateRobots().includes("Sitemap:"))
})

test("generateRobots: a group toggles every member; a named agent overrides its group; * comes last", () => {
  const text = generateRobots({ ai: true, search: false, GPTBot: false, gptbot: false, MyBot: true, all: false })
  const rules = blocks(text)
  assert.equal(rules.ClaudeBot, "Allow: /")
  assert.equal(rules.GPTBot, "Disallow: /", "the named override wins over the group")
  assert.equal(rules.Googlebot, "Disallow: /")
  assert.equal(rules.MyBot, "Allow: /", "an unknown agent is written as spelled")
  assert.equal(rules["*"], "Disallow: /")
  assert.ok(!("gptbot" in rules), "case-insensitive: one block per agent, in the group's spelling")
  assert.ok(text.trimEnd().endsWith("User-agent: *\nDisallow: /"))
})

test("generateRobots: a non-boolean value is ignored, and a domain adds the Sitemap line", () => {
  const text = generateRobots({ ai: "yes please", images: null }, "example.com")
  const rules = blocks(text)
  assert.equal(rules.GPTBot, "Disallow: /", "defaults still apply under a bad value")
  assert.ok(text.endsWith("Sitemap: https://example.com/sitemap.xml"))
})

test("robots.txt follows the root settings.md, and re-expands when the setting changes", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-robots-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-robots-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    await writeFile(path.join(sourceFolder, "settings.md"), "---\ndomain: example.com\nrobots:\n  ai: true\n  all: false\n---\n")
    site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    await (await site.build()).deferred

    const first = blocks(await readFile(path.join(targetFolder, "robots.txt"), "utf-8"))
    assert.equal(first.GPTBot, "Allow: /")
    assert.equal(first["*"], "Disallow: /")
    assert.ok((await readFile(path.join(targetFolder, "robots.txt"), "utf-8")).includes("Sitemap: https://example.com/sitemap.xml"))

    await writeFile(path.join(sourceFolder, "settings.md"), "---\ndomain: example.com\nrobots:\n  ai: false\n---\n")
    await (await site.build({ changed: ["settings.md"] })).deferred

    const second = blocks(await readFile(path.join(targetFolder, "robots.txt"), "utf-8"))
    assert.equal(second.GPTBot, "Disallow: /")
    assert.equal(second["*"], undefined)
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
