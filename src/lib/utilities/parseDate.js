import dates from 'any-date-parser';
import ago from 'any-date-parser/src/formats/ago/ago.js';
import chinese from 'any-date-parser/src/formats/chinese/chinese.js';
import dayMonth from 'any-date-parser/src/formats/dayMonth/dayMonth.js';
import dayMonthname from 'any-date-parser/src/formats/dayMonthname/dayMonthname.js';
import monthDay from 'any-date-parser/src/formats/monthDay/monthDay.js';
import monthnameDay from 'any-date-parser/src/formats/monthnameDay/monthnameDay.js';
import today from 'any-date-parser/src/formats/today/today.js';

dates.removeFormat(ago);
dates.removeFormat(chinese);
dates.removeFormat(dayMonth);
dates.removeFormat(dayMonthname);
dates.removeFormat(monthDay);
dates.removeFormat(monthnameDay);
dates.removeFormat(today);

/*
Left in the following formats:

microsoftJson
dayMonthYear
dayMonthnameYear
monthDayYear
monthnameDayYear
twitter
yearMonthDay
atSeconds
time12Hours
time24Hours
*/

export default function parseDate(maybeDate) {
	if (!maybeDate) return false;
	if (maybeDate instanceof Date) return maybeDate;
	if (typeof maybeDate === 'number') return false;
	if (typeof maybeDate === 'string' && maybeDate.match(/^\d+$/)) return false;
	const parsedDate = dates.attempt(maybeDate);
	if (parsedDate.invalid) return false;
	const { month, day, year } = parsedDate;
	const date = new Date(`${year}-${month}-${day}`);
	return date;
}
