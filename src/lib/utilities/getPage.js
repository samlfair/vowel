// import objectPath from 'object-path';

/**
 * Takes a file URL and a website object and returns the file object.
 * @param {import('./processMarkdownFiles').Directory} website - A website object.
 * @param {string} path - A `/`-delimited filepath.
 * @returns {import('./processMarkdownFiles').MarkdownFile}
 */
export default function getPage(website, path) {
	let page = website;

	// const dotPath = path.replace(/^\//, '').replaceAll('/', '.') + (path ? '.' : '') + '$';

	const segments = path
		.replace(/^\//, '')
		.concat(path ? '/$' : '$')
		.split('/');

	segments.forEach((segment) => {
		if (segment === '_') return page[segment];
		if (typeof page === 'object' && page !== null) page = page[segment];
	});

	return page;
}
