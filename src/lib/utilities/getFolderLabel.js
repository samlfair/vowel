import { getFileLabel } from '.';

const fallBackLabel = 'Untitled';

export default function getFolderLabel(folder, shorter, date) {
	if (typeof folder !== 'object') return 'Untitled';
	return (
		getFileLabel(folder['_'], shorter, date) ||
		getFileLabel(folder['$'], shorter, date) ||
		fallBackLabel
	);
}
