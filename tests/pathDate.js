import { test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import pathDate from "../pathDate.js"

/** @param {string} urlPath - written with "/", as a reader would */
function iso(urlPath) {
  const sourcePath = urlPath.split("/").join(path.sep)
  return pathDate(sourcePath)?.toISOString().slice(0, 10)
}

test("year, month and day folders are a date", () => {
  assert.equal(iso("2023/04/07/hello-world.md"), "2023-04-07")
  assert.equal(iso("blog/2023/4/7/hello-world.md"), "2023-04-07")
})

test("the day can be the filename, and the month a name", () => {
  assert.equal(iso("journal/2024/april/1.md"), "2024-04-01")
  assert.equal(iso("journal/2024/Sept/30.md"), "2024-09-30")
  assert.equal(iso("journal/2024/dec/31.md"), "2024-12-31")
})

test("a YYYY-MM-DD filename prefix is a date, and beats the folders", () => {
  assert.equal(iso("wiki/daily/2026-02-28.md"), "2026-02-28")
  assert.equal(iso("blog/2024/2024-11-03-sixty.md"), "2024-11-03")
  assert.equal(iso("journal/2023/03/2023-03-24.md"), "2023-03-24")
  assert.equal(iso("2020/01/01/2023-03-24.md"), "2023-03-24")
})

test("the deepest run of folders wins", () => {
  assert.equal(iso("2020/01/01/archive/2023/03/24/post.md"), "2023-03-24")
})

test("numbers that are not in year, month, day order are not a date", () => {
  assert.equal(iso("blog/2024/top-10/3.md"), undefined)
  assert.equal(iso("blog/2023/12-days-of-christmas.md"), undefined)
  assert.equal(iso("2024/07.md"), undefined)
  assert.equal(iso("07/04/2024.md"), undefined)
  assert.equal(iso("blog/04/07/2023/post.md"), undefined)
})

test("a year alone, or a year and month, is not a date", () => {
  assert.equal(iso("projects/2024-orrery/index.md"), undefined)
  assert.equal(iso("journal/2024/april/notes.md"), undefined)
  assert.equal(iso("blog/2024/year-2024.md"), undefined)
  assert.equal(iso("reference/changelog/v0.1.0.md"), undefined)
})

test("a day or month that does not exist is not a date", () => {
  assert.equal(iso("blog/2023/02/30.md"), undefined)
  assert.equal(iso("blog/2023/13/01.md"), undefined)
  assert.equal(iso("blog/2023/00/01.md"), undefined)
  assert.equal(iso("blog/2023/01/00.md"), undefined)
  assert.equal(iso("wiki/daily/2026-02-30.md"), undefined)
})

test("a misspelled month or a longer number is not a date", () => {
  assert.equal(iso("journal/2024/sepember/1.md"), undefined)
  assert.equal(iso("journal/2024/aprill/1.md"), undefined)
  assert.equal(iso("journal/2024/04/123.md"), undefined)
  assert.equal(iso("wiki/2026-02-281.md"), undefined)
})
