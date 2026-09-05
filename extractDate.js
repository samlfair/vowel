const MONTH_INDEXES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
}

/**
 * Months arrive either as a name ("January", "Sept") or as a number.
 * @param {string} month
 */
function monthIndex(month) {
  const named = MONTH_INDEXES[String(month).slice(0, 3).toLowerCase()]
  if (named !== undefined) return named
  return Number(month) - 1
}

/**
 * @param {string} text
 */
function extractDate(text) {
  const dateRegex = /(?:\b(?<first_segment>(?<first_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<first_YYYY>\d\d\d\d)|(?<first_do>(?:\d|[0-3]\d)(?:st|nd|rd|th))|(?<first_dd_or_MM_or_yy>[0-3]\d)|(?<first_d_or_M>\d))(?<first_delimiter>\.| |, |\/|-)?)(?:\b(?<second_segment>(?<second_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<second_YYYY>\d\d\d\d)|(?<second_do>(\d\d)(:?st|nd|rd|th))|(?<second_dd_or_MM_or_yy>[0-3]\d)|(?<second_d_or_M>\d))(?<second_delimiter>\.| |, |\/|-)?)(?:\b(?<third_segment>(?<third_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<third_YYYY>\d\d\d\d)|(?<third_do>(\d\d)(?:st|nd|rd|th))|(?<third_dd_or_MM_or_yy>[0-3]\d)|(?<third_d_or_M>\d)))(?<time>(?<time_delimiter>T|\ | at )(?<H_or_HH>[0-2]?\d):(?<MM>[0-6]\d)(?::(?<SS>00))?(?:\.(?<SSS>\d\d\d))?(?<Z>Z|(?:\+(\d\d):(\d\d)))?(?<meridiam_indicator>am|pm)?)?/i

  const dateMatch = dateRegex.exec(text)
  if(!dateMatch) return

  const data = {
    rawDate: dateMatch[0],
    year: null,
    month: null,
    day: null,
    hours: null,
    minutes: null,
    seconds: null,
    meridiam_indicator: null,
    timezone: null
  }

  const { groups } = dateMatch

  const knownYear = groups.first_YYYY || groups.second_YYYY || groups.third_YYYY
  const knownMonth = groups.first_MMM_or_MMMM || groups.second_MMM_or_MMMM || groups.third_MMM_or_MMMM
  const knownDay = groups.first_do || groups.second_do || groups.third_do
  const firstUnknowns = groups.first_dd_or_MM_or_yy || groups.first_d_or_M
  const secondUnknowns = groups.second_dd_or_MM_or_yy || groups.second_d_or_M
  const thirdUnknowns = groups.third_dd_or_MM_or_yy || groups.third_d_or_M
  const allUnknowns = firstUnknowns || secondUnknowns || thirdUnknowns

  if (knownYear) {
    data.year = knownYear
    if (knownMonth) {
      data.month = knownMonth
      data.day = knownDay || allUnknowns
    } else if (knownDay) {
      data.month = allUnknowns
      data.day = knownDay
    } else {
      if (firstUnknowns) {
        data.day = firstUnknowns
        data.month = secondUnknowns
      } else if (thirdUnknowns) {
        data.month = secondUnknowns
        data.day = thirdUnknowns
      } else {
        return false
      }
    }
  } else if (knownMonth) {
    data.month = knownMonth
    if (knownDay) {
      data.day = knownDay
      data.year = allUnknowns
    } else {
      console.warn("The date parser has encountered a ambiguous date with a long month and a short year (e.g. `2 June 13`). Rewrite the date in a standard format.")
      return false
    }
  } else if (knownDay) {
    console.warn("The date parser has encountered an ambigous date format with an ordinal date, a short month, and a short year (e.g. 5th 06/24). Rewrite the date in a standard format.")
    return false
  } else {
    data.year = "20" + groups.first_dd_or_MM_or_yy
    data.month = groups.second_dd_or_MM_or_yy || groups.second_d_or_M
    data.day = groups.third_dd_or_MM_or_yy || groups.third_d_or_M
  }
  if (groups.time) {
    const isPM = /pm/i.test(groups.meridiam_indicator)
    data.hours = isPM ? Number(groups.H_or_HH) + 12 : groups.H_or_HH
    data.minutes = groups.MM
    data.seconds = groups.SS || 0
    data.timezone = groups.Z
  }

  // A bare "YYYY M D" string is parsed as local time, which shifts the
  // date by a day in any timezone east of UTC and by an odd LMT offset
  // before standardization (Amsterdam in the year 1000 is +00:17:30). The
  // date an author writes has no timezone, so build it as UTC and only
  // honour an offset when one was written explicitly.
  const year = Number(data.year)
  const month = monthIndex(data.month)
  const day = parseInt(data.day, 10)

  const hours = data.hours ? Number(data.hours) : 0
  const minutes = data.minutes ? Number(data.minutes) : 0
  const seconds = data.seconds ? Number(data.seconds) : 0

  // Date.UTC rolls out-of-range parts over into neighbouring months and
  // years, so an ISBN's segments would silently become a real date. The
  // string parse this replaced rejected them, and callers still rely on
  // that: the frontmatter renderer only treats a value as a date when the
  // result is valid.
  const partsAreSane =
    Number.isInteger(year) &&
    Number.isInteger(month) && month >= 0 && month <= 11 &&
    Number.isInteger(day) && day >= 1 && day <= 31

  if (!partsAreSane) return new Date(NaN)

  if (data.timezone) {
    const pad = (value, width = 2) => String(value).padStart(width, "0")
    const stamp = `${pad(year, 4)}-${pad(month + 1)}-${pad(day)}` +
      `T${pad(hours)}:${pad(minutes)}:${pad(seconds)}${data.timezone}`
    return new Date(stamp)
  }

  const result = new Date(Date.UTC(year, month, day, hours, minutes, seconds))

  // Catches the rollover that survives the range check - 31 February.
  const rolled =
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month ||
    result.getUTCDate() !== day

  return rolled ? new Date(NaN) : result
}

export default extractDate

