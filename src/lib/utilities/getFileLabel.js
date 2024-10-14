import { capitalCase } from 'change-case';

function createTitleFromDescription(description) {
	if (description?.length > 30) {
		return description.slice(0, 30) + '...';
	}
	return description;
}

export default function getFileLabel(page, shorter = false, date = true) {
	const description = createTitleFromDescription(
		page?.description || page?.imputedProperties?.description
	);

	const fileName = page?.imputedProperties?.fileName
		? capitalCase(page?.imputedProperties?.fileName)
		: false;

	const formattedDate =
		page?.date && date
			? new Intl.DateTimeFormat('en-US').format(new Date(page?.date?.output))
			: false;

	return (
		(shorter && page?.breadcrumb) ||
		page?.title ||
		page?.imputedProperties?.title ||
		page?.breadcrumb ||
		formattedDate ||
		(shorter && fileName) ||
		description ||
		fileName ||
		null
	);
}
