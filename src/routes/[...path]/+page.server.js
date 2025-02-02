import { getPagesByFolder, processMarkdownFiles, loadCache } from '../../lib/utilities';

export const prerender = true;

function createURL(domain, path) {
	try {
		return new URL(path, domain)
	} catch(e) {
		console.error(e)
		return ""
	}
}

/** @type {import('./$types').PageLoad} */
export async function load({ params, parent }) {
	const { website } = await parent()
	const url =createURL(website._.domain, params.path)
	// const url = new URL(params.path, website._.domain)
	
	const webmentionTarget = params.path === "" ? url.origin : url.href

	const webmentions = await (await fetch(`https://webmention.io/api/mentions.jf2?target=${webmentionTarget}`)).json()

	const { path } = params;
	const segments = path ? params.path.split('/') : [];

	return { path, segments, webmentions };
}

export async function entries() {
	const initialCache = await loadCache($home[0]);

	const { folder: website } = await processMarkdownFiles(initialCache);

	const pages = getPagesByFolder(website, '/', false).map((page) => {
		return { path: page.url?.replace('/', '') };
	});

	pages.push({ path: '404' });

	return pages;
}
