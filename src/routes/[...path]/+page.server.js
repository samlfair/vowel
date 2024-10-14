import { getPagesByFolder, processMarkdownFiles, loadCache } from '../../lib/utilities';

export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const { path } = params;
	const segments = path ? params.path.split('/') : [];

	return { path, segments };
}

export async function entries() {
	const initialCache = await loadCache($home[0]);

	const { folder: website } = await processMarkdownFiles(initialCache);

	const pages = getPagesByFolder(website, '/', false).map((page) => {
		return { path: page.url?.replace('/', '') };
	});

	pages.push({ path: '404' });

	console.log({ pages });

	return pages;
}
