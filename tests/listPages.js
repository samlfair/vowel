import { test } from "node:test"
import assert from "node:assert"
import { listPages } from "../utils.js"

/**
 * A stand-in for votive's api: `targets()` returns whatever the test
 * seeded, so this exercises listPages' filtering rather than the query
 * engine behind it.
 * @param {object[]} targets
 */
function apiWith(targets) {
  return { targets: () => targets }
}

const page = (path, extra = {}) => ({ path, extension: ".html", write: true, metadata: { title: path }, ...extra })

test("listPages: ordinary pages pass through", () => {
  const api = apiWith([page("index.html"), page("about.html")])
  assert.deepEqual(listPages(api, {}).map(t => t.path), ["index.html", "about.html"])
})

test("listPages: virtual targets are dropped", () => {
  // Both of vowel's own virtual targets are meant to be invisible:
  // `html_file: false`, and the public shadow a secret_key page leaves
  // behind, whose prettyURL is the secret path.
  const api = apiWith([
    page("index.html"),
    page("about.html", { write: false, metadata: { title: "About", prettyURL: "/5327f5f7deadbeef" } })
  ])
  const listed = listPages(api, {})
  assert.deepEqual(listed.map(t => t.path), ["index.html"])
  assert.ok(!JSON.stringify(listed).includes("5327f5f7"), "a secret URL must never reach a listing")
})

test("listPages: the \"0\" placeholder is dropped", () => {
  // A source whose router returns false collapses to "0", and the row
  // still carries that source's metadata - so it used to render as a
  // real entry with someone's settings.md title on it.
  const api = apiWith([
    page("index.html"),
    { path: "0", extension: "", write: true, metadata: { title: "Wow!" } }
  ])
  assert.deepEqual(listPages(api, {}).map(t => t.path), ["index.html"])
})

test("listPages: settings.md targets are dropped", () => {
  // Emitted as real targets so the settings panel can fetch them.
  const api = apiWith([
    page("index.html"),
    { path: "settings.md", extension: ".md", write: true, metadata: {} },
    { path: "shop/settings.md", extension: ".md", write: true, metadata: {} }
  ])
  assert.deepEqual(listPages(api, {}).map(t => t.path), ["index.html"])
})

test("listPages: copy-through assets are dropped", () => {
  // Fonts and images became visible to listings once votive stopped
  // returning undefined for a target with no abstract. They have no
  // title, so each rendered as an empty <article>.
  const api = apiWith([
    page("index.html"),
    { path: "necklace.jpg", extension: ".jpg", write: true, metadata: { uuid: "x" } },
    { path: "fraunces-regular.ttf", extension: ".ttf", write: true, metadata: {} }
  ])
  assert.deepEqual(listPages(api, {}).map(t => t.path), ["index.html"])
})

test("listPages: the query is passed straight through to the api", () => {
  let seen
  const api = { targets: (query) => { seen = query; return [] } }
  const query = { folder: "blog", recursive: true, query: { tags: "design" } }
  listPages(api, query)
  assert.deepEqual(seen, query)
})
