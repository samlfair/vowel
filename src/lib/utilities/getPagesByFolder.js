// @ts-ignore
import { getFolder, getFileLabel } from '.';

// @ts-ignore
const excludedFileNames = ['_'];

/**
 * Traverse a folder to get all of the pages.
 * @param {import('./processMarkdownFiles').Directory} folder - The path to the folder to retrieve.
 * @param {boolean} root - Whether this is the root of the recursion.
 * @returns {Array<Page>}
 */
function traverseFolder(folder, root = false, property = '.') {
	let propertyKey = (property || '.').split('.')[0];
	let propertyValue = (property || '.').split('.')[1];

	let pages = [];

	for (let key in folder) {
		if (!key.startsWith('$') || key.length === 1) {
			if (key === '$') {
				if (!root) {
					if (propertyKey) {
						if (
							folder[key].hasOwnProperty(propertyKey) &&
							folder[key][propertyKey] === propertyValue
						) {
							pages.push(folder[key]);
						}
					} else {
						pages.push(folder[key]);
					}
				}
				// if (
				// 	!root &&
				// 	folder[key].$?.hasOwnProperty(propertyKey) &&
				// 	folder[key][propertyKey] === propertyValue
				// )
				// 	pages.push(folder[key]);
			} else if (key !== '_') {
				const child = folder[key];

				// @ts-ignore
				pages.push(...traverseFolder(child, false, property));
			}
		}
	}

	// @ts-ignore
	return pages;
}

/**
 * Description
 * @param {Page} a
 * @param {Page} b
 * @returns {number}
 */
function sortPage(a, b) {
	if (a.hasOwnProperty('date') && !b.hasOwnProperty('date')) return -1;
	else if (!a.hasOwnProperty('date') && b.hasOwnProperty('date')) return 1;
	else if (a.date && b.date) {
		const aDate = Number(new Date(a.date.output));
		const bDate = Number(new Date(b.date.output));
		return bDate - aDate;
	} else if (getFileLabel(a) > getFileLabel(b)) return 1;
	return -1;
}

/**
 * @typedef {import('./processMarkdownFiles').MarkdownFile} Page
 */

/**
 * Recursively get all of the pages in a folder.
 * @param {import('./processMarkdownFiles').Directory} website - The entire website.
 * @param {string} path - The path to the folder to retrieve.
 * @param {number | undefined} count - Number of pages to return.
 * @returns {Array<Page>}
 */
export default function getPagesByFolder(
	website,
	path,
	excludeRoot = true,
	count = undefined,
	property
) {
	const folder = getFolder(website, path);

	const pages = traverseFolder(folder, excludeRoot, property);

	pages.sort(sortPage);

	return pages.slice(0, count);
}
