import {
	processMarkdownFiles,
	loadCache,
	checkFileExists,
	readMarkdownFile
} from '$lib/utilities';
import { join } from 'path';


export const prerender = true;

async function getPublishedData(domain) {
	try {
		const publishedURL = new URL("/$vowel/published.json", domain)
		const publishedDataResponse = await fetch(publishedURL.href)
		const publushedDataJSON = await publishedDataResponse.json()
		return publushedDataJSON
	} catch (e) {
		console.log(e)
		return undefined
	}
}

export async function GET() {
	// everything.request.url

	let settings

	const settingsPath = join($home[0], "/settings.md")
	const settingsExists = await checkFileExists(settingsPath);
	if (settingsExists) {
		settings = await readMarkdownFile(settingsPath)
	}

	// Get published articles from live site
	const publishedData = await getPublishedData(settings.frontmatter.domain)

	// if($publish[0]) {
	if (true) {
		const initialCache = await loadCache($home[0]);


		const { folder: website } = await processMarkdownFiles(initialCache, publishedData, settings.frontmatter.domain);
	}

	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=1',
		'Content-Type': 'text/plain'
	};

	const response = new Response(JSON.stringify(publishedData), {
		headers
	});
	return response;
}
