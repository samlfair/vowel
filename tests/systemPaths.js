import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { systemDirectoryFor } from "../systemPaths.js"

test("systemDirectoryFor", async (t) => {
  await t.test("is deterministic for the same source folder", () => {
    assert.equal(systemDirectoryFor("/projects/a"), systemDirectoryFor("/projects/a"))
  })

  await t.test("differs for different source folders", () => {
    assert.notEqual(systemDirectoryFor("/projects/a"), systemDirectoryFor("/projects/b"))
  })

  await t.test("resolves relative source folders before hashing, so cwd-relative and absolute forms match", () => {
    const absolute = path.join(process.cwd(), "example-project")
    const relative = "example-project"
    assert.equal(systemDirectoryFor(relative), systemDirectoryFor(absolute))
  })

  await t.test("is nested under a 'votive' segment", () => {
    assert.ok(systemDirectoryFor("/projects/a").split(path.sep).includes("votive"))
  })
})
