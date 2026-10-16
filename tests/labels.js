import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import votive from "votive"
import { createConfig } from "../config.js"
import { labelFromName } from "../utils.js"

test("labelFromName: a name the author cased is kept; an all-lowercase one is sentence-cased, hyphens and underscores as spaces", () => {
  assert.equal(labelFromName("hello-world"), "Hello world")
  assert.equal(labelFromName("hello world"), "Hello world")
  assert.equal(labelFromName("snake_case_name"), "Snake case name")
  assert.equal(labelFromName("machine-learning"), "Machine learning")
  assert.equal(labelFromName("Hello World"), "Hello World")
  assert.equal(labelFromName("Hello world"), "Hello world")
  assert.equal(labelFromName("iPhone notes"), "iPhone notes")
  assert.equal(labelFromName("README"), "README")
  assert.equal(labelFromName("api-design"), "Api design", "awkward, and accepted")
  assert.equal(labelFromName(""), "")
  assert.equal(labelFromName(undefined), undefined)
})

test("inferred titles, breadcrumbs, folder indexes and tag pages all follow it", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-labels-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-labels-sys-"))
  try {
    await mkdir(path.join(sourceFolder, "field-notes"))
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    await writeFile(path.join(sourceFolder, "field-notes", "first-light.md"), "No heading here. #machine-learning\n")
    await writeFile(path.join(sourceFolder, "field-notes", "Kept As Written.md"), "Also no heading.\n")
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    try {
      await (await site.build()).deferred
      const read = (file) => readFile(path.join(targetFolder, file), "utf-8")
      const page = await read("field-notes/first-light.html")
      assert.match(page, /<h1>First light<\/h1>/)
      assert.match(page, /<a href="?\/field-notes"?>Field notes<\/a>/, "the folder's crumb")
      assert.match(await read("field-notes.html"), /<h1>Field notes<\/h1>/, "the folder's index")
      assert.match(await read("tags/machine-learning.html"), /<h1>Machine learning<\/h1>/, "the tag page")
      assert.match(await read("field-notes/kept-as-written.html"), /<h1>Kept As Written<\/h1>/)
    } finally {
      await site.close()
    }
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("pageClasses: one class per folder, from the top, and one for the page; the root is page_home", async () => {
  const { pageClasses } = await import("../utils.js")
  assert.deepEqual(pageClasses("/"), ["page_home"])
  assert.deepEqual(pageClasses("/about"), ["page_about"])
  assert.deepEqual(pageClasses("/blog/travel/hello-world"), ["folder_blog", "folder_blog_travel", "page_blog_travel_hello-world"])
  assert.deepEqual(pageClasses("/notes/snake_case"), ["folder_notes", "page_notes_snake-case"], "_ only ever joins segments")
})

test("the classes are on <body>, and on each card's itemscoped <article> in a listing", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-classes-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-classes-sys-"))
  try {
    await mkdir(path.join(sourceFolder, "blog", "travel"), { recursive: true })
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n/blog/**\n")
    await writeFile(path.join(sourceFolder, "blog", "travel", "hello-world.md"), "---\ndate: 2026-03-04\n---\n# Hello world\n\nA trip.\n")
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    try {
      await (await site.build()).deferred
      const read = (file) => readFile(path.join(targetFolder, file), "utf-8")
      assert.match(await read("index.html"), /<body class="?page_home"?>/)
      const post = await read("blog/travel/hello-world.html")
      assert.match(post, /<body class="folder_blog folder_blog_travel page_blog_travel_hello-world">/)
      assert.match(await read("index.html"), /<article class="folder_blog folder_blog_travel page_blog_travel_hello-world"\s*itemscope>/, "the card")
    } finally {
      await site.close()
    }
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("a secret segment is its name in the classes, never its hash or salt - as in the breadcrumb", async () => {
  const { pageClasses } = await import("../utils.js")
  const { secretRouter } = await import("../secretPaths.js")
  const source = path.join("blog", "secret##purple-moon", "hello-world.md")
  const url = "/" + secretRouter("blog/secret##purple-moon/hello-world.md").toLowerCase().replace(/\.md$/, "")
  assert.match(url, /^\/blog\/[0-9a-f]{16}\/hello-world$/)
  assert.deepEqual(pageClasses(url, source), ["folder_blog", "folder_blog_secret", "page_blog_secret_hello-world"])
  const secretPage = path.join("notes", "diary##salt.md")
  const pageURL = "/" + secretRouter("notes/diary##salt.md").toLowerCase().replace(/\.md$/, "")
  assert.deepEqual(pageClasses(pageURL, secretPage), ["folder_notes", "page_notes_diary"])
  assert.deepEqual(pageClasses("/my notes/page", path.join("My Notes", "page.md")), ["folder_my-notes", "page_my-notes_page"], "a space becomes -")
})

test("<title> names every folder, leaf first, a secret one by its name; the page's body classes do too", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-titles-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-titles-sys-"))
  try {
    await mkdir(path.join(sourceFolder, "blog", "secret##purple-moon"), { recursive: true })
    await writeFile(path.join(sourceFolder, "settings.md"), "---\nname: Site\n---\n")
    await writeFile(path.join(sourceFolder, "blog", "secret##purple-moon", "hello-world.md"), "# Hello world\n")
    const targetFolder = path.join(systemFolder, "output")
    const site = await votive(createConfig(sourceFolder, {
      targetFolder,
      databasePath: path.join(systemFolder, ".votive.db"),
      cacheDirectory: path.join(systemFolder, ".cache"),
      logging: "silent"
    }))
    try {
      await (await site.build()).deferred
      const { secretRouter } = await import("../secretPaths.js")
      const file = secretRouter("blog/secret##purple-moon/hello-world.md").toLowerCase().replace(/\.md$/, ".html")
      const html = await readFile(path.join(targetFolder, file), "utf-8")
      assert.match(html, /<title>Hello world - Secret - Blog - Site<\/title>/)
      assert.match(html, /<body class="folder_blog folder_blog_secret page_blog_secret_hello-world">/)
      assert.ok(!html.includes("purple-moon"), "no salt")
    } finally {
      await site.close()
    }
  } finally {
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
