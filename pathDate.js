import path from "node:path"
import { monthIndex } from "./extractDate.js"

// Strict on purpose, and separate from extractDate's pattern: that one is
// unanchored and reads day-first orders, so on "2023/03/2023-03-24" it
// matches "2023/03/2023". A path is a guess the author never wrote as a
// date, so only the year-month-day order counts, each part a whole
// segment.
const YEAR = /^\d{4}$/
const MONTH = /^(?:\d{1,2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)$/i
const DAY = /^\d{1,2}$/
const NAME_PREFIX = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/

/**
 * @param {string} year
 * @param {string} month - a number or a month name
 * @param {string} day
 */
function calendarDate(year, month, day) {
  const yearNumber = Number(year)
  const monthNumber = monthIndex(month)
  const dayNumber = Number(day)
  const date = new Date(Date.UTC(yearNumber, monthNumber, dayNumber))

  // Date.UTC rolls 30 February into March and month 13 into next year,
  // and maps years 0-99 to 1900-1999; any of those is not the date the
  // path spelled.
  const rolled =
    date.getUTCFullYear() !== yearNumber ||
    date.getUTCMonth() !== monthNumber ||
    date.getUTCDate() !== dayNumber

  if (rolled) return
  return date
}

/**
 * @param {string} year
 * @param {string} month
 * @param {string} day
 */
function segmentsDate(year, month, day) {
  const isDate = YEAR.test(year) && MONTH.test(month) && DAY.test(day)
  if (!isDate) return
  return calendarDate(year, month, day)
}

/**
 * The date a source path spells, or undefined: a `YYYY-MM-DD` filename
 * prefix (`blog/2024/2024-11-03-sixty.md`), else a year, month and day in
 * neighbouring segments (`2023/04/07/hello-world.md`,
 * `journal/2024/april/1.md`), the deepest run winning. A secret segment's
 * salt should already be stripped (displayPath).
 * @param {string} sourcePath - project-relative
 */
function pathDate(sourcePath) {
  const { dir, name } = path.parse(sourcePath)

  const prefix = NAME_PREFIX.exec(name)
  const nameDate = prefix ? calendarDate(prefix[1], prefix[2], prefix[3]) : undefined
  if (nameDate) return nameDate

  const segments = [...dir.split(path.sep), name]
  const dates = segments.slice(0, -2).map((year, index) => segmentsDate(year, segments[index + 1], segments[index + 2]))
  return dates.findLast(Boolean)
}

export default pathDate
export { pathDate }
