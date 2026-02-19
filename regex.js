
const dateRegex = /(?:\b(?<first_segment>(?<first_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<first_YYYY>\d\d\d\d)|(?<first_do>(?:\d|[0-3]\d)(?:st|nd|rd|th))|(?<first_dd_or_MM_or_yy>[0-3]\d)|(?<first_d_or_M>\d))(?<first_delimiter>\.| |, |\/|-)?)(?:\b(?<second_segment>(?<second_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<second_YYYY>\d\d\d\d)|(?<second_do>(\d\d)(:?st|nd|rd|th))|(?<second_dd_or_MM_or_yy>[0-3]\d)|(?<second_d_or_M>\d))(?<second_delimiter>\.| |, |\/|-)?)(?:\b(?<third_segment>(?<third_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<third_YYYY>\d\d\d\d)|(?<third_do>(\d\d)(?:st|nd|rd|th))|(?<third_dd_or_MM_or_yy>[0-3]\d)|(?<third_d_or_M>\d)))(?<time>(?<time_delimiter>T|\ | at )(?<H_or_HH>[0-2]?\d):(?<MM>[0-6]\d)(?::(?<SS>00))?(?:\.(?<SSS>\d\d\d))?(?<Z>Z|(?:\+(\d\d):(\d\d)))?(?<meridiam_indicator>am|pm)?)?/mig
const slice = /(?:\b(?<first_segment>(?<first_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<first_YYYY>\d\d\d\d)|(?<first_do>(?:\d|[0-3]\d)(?:st|nd|rd|th))|(?<first_dd_or_MM_or_yy>[0-3]\d)|(?<first_d_or_M>\d))(?<first_delimiter>\.| |, |\/|-)?)(?:\b(?<second_segment>(?<second_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<second_YYYY>\d\d\d\d)|(?<second_do>(\d\d)(:?st|nd|rd|th))|(?<second_dd_or_MM_or_yy>[0-3]\d)|(?<second_d_or_M>\d))(?<second_delimiter>\.| |, |\/|-)?)(?:\b(?<third_segment>(?<third_MMM_or_MMMM>January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)|(?<third_YYYY>\d\d\d\d)|(?<third_do>(\d\d)(?:st|nd|rd|th))|(?<third_dd_or_MM_or_yy>[0-3]\d)|(?<third_d_or_M>\d)))/

const test = [
	"111",
	"1/1/1",
	"02/03/24",
	"2025-01-15",
	"03/22/2023",
	"1999.12.31",
	"April 9, 2011 at 8:00pm",
	"17th October 2020",
	"2000/07/04",
	"05-Aug-1985",
	"Sunday, March 3, 2030",
	"14 Sep 2014",
	"Dec 25, 2022",
	"07.11.2017",
	"29-Feb-2016",
	"Monday, 1st January 1996",
	"09/09/1999",
	"03/04/203",
	"June 37",
	"1999/13",
	"April-09-11",
	"17 October, '20",
	"20000704",
	"05-August-85",
	"14-September-2014",
	"25th of Dec, 2022",
	"07.11.17",
	"29-02-16",
	"Monday 1st Jan 96",
	"09.09/1999"
]
