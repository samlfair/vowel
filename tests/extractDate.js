import { test } from "node:test"
import assert from "node:assert"
import extractDate from "../extractDate.js"

/** @param {unknown} value */
function iso(value) {
  if (!(value instanceof Date) || isNaN(value)) return String(value)
  return value.toISOString()
}

test("parses a plain ISO date as UTC midnight", () => {
  assert.equal(iso(extractDate("2026-03-04")), "2026-03-04T00:00:00.000Z")
})

test("handles dates before the epoch, back past the millennium", () => {
  assert.equal(iso(extractDate("1969-07-20")), "1969-07-20T00:00:00.000Z")
  assert.equal(iso(extractDate("1900-01-01")), "1900-01-01T00:00:00.000Z")
  assert.equal(iso(extractDate("1000-01-01")), "1000-01-01T00:00:00.000Z")
})

test("named months work at any year", () => {
  assert.equal(iso(extractDate("January 5, 1000")), "1000-01-05T00:00:00.000Z")
  assert.equal(iso(extractDate("15 June 1500")), "1500-06-15T00:00:00.000Z")
  assert.equal(iso(extractDate("Sept 9, 1999")), "1999-09-09T00:00:00.000Z")
})

test("an explicit offset is honoured rather than overridden", () => {
  assert.equal(iso(extractDate("2026-03-04T12:00Z")), "2026-03-04T12:00:00.000Z")
  assert.equal(iso(extractDate("2026-03-04T12:00+02:00")), "2026-03-04T10:00:00.000Z")
})

test("things that merely look date-shaped do not become valid dates", () => {
  // The frontmatter renderer relies on this: a version string or an ISBN
  // must not be mistaken for a date.
  assert.ok(isNaN(extractDate("1.2.3")))
  assert.ok(isNaN(extractDate("978-3-16-148410-0")))
  assert.equal(extractDate("hello world"), undefined)
  assert.equal(extractDate("5"), undefined)
})

test("years below 1000 are not recognized", () => {
  // The pattern requires four digits, so a three-digit year is not a date.
  assert.equal(extractDate("999-01-01"), undefined)
})

test("parsing does not depend on the machine's timezone", () => {
  // Regression: dates were built from a bare "YYYY M D" string, which JS
  // parses as local time. East of UTC that shifted the date back a day,
  // and before standardization by an odd LMT offset (Amsterdam in the year
  // 1000 is +00:17:30).
  const original = process.env.TZ

  for (const zone of ["UTC", "America/New_York", "Europe/Amsterdam", "Pacific/Auckland"]) {
    process.env.TZ = zone
    for (const date of ["1000-01-01", "1900-01-01", "1969-07-20", "2026-03-04"]) {
      assert.equal(iso(extractDate(date)), `${date}T00:00:00.000Z`, `${date} in ${zone}`)
    }
  }

  process.env.TZ = original
})

test("out-of-range parts are rejected rather than rolled over", () => {
  // Date.UTC turns month 15 into the next year's April; the old
  // string-based parse rejected it, and callers still depend on that.
  assert.ok(isNaN(extractDate("2026-15-40")))
  assert.ok(isNaN(extractDate("2026-02-31")))
})
