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

  const time = groups.time ? `${data.hours}:${data.minutes}:${data.seconds}${data.timezone || ""}` : null
  const dateString = `${data.year} ${data.month} ${data.day}${time ? " " + time : ""}`

  return new Date(dateString)
}

export default extractDate

