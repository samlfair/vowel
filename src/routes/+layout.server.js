import { loadCache, writeCache, processMarkdownFiles, readMarkdownFile } from '$lib/utilities';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { normalize, join, basename } from 'path';
import { dev } from '$app/environment';
import mri from 'mri';

const args = mri(process.argv);
const isBuild = args._.includes('build');

export const prerender = true;
export const csr = dev;

let contentCache = false;
// let contentCacheTime = $build[0] ? 600000 : 0;

async function checkFileExists(filePath, homeDir) {
	try {
		await access(join(homeDir, filePath), constants.F_OK);
		return true;
	} catch {
		return false;
	}
}



/** @type {import('./$types').PageLoad} */
export async function load() {
	// const startLoad = performance.now();

	const hotURLCache = await loadCache($home[0]);

	const initialURLCache = JSON.parse(JSON.stringify(hotURLCache));

	const cssExists = await checkFileExists(normalize('/assets/styles.css'), $home[0]);

	// if (cssExists) console.log('Found CSS file at /assets/styles.css');
	// else console.log('No CSS file found as /assets/styles.css');

	const faviconExists = await checkFileExists(normalize('/assets/favicon.png'), $home[0]);

	const files = {
		css: {
			exists: cssExists,
			path: join($home[0], 'assets', 'styles.css')
		},
		favicon: {
			exists: faviconExists,
			path: join($home[0], 'assets', 'favicon.png')
		}
	};




	let data = {};

	if (contentCache) {
		console.log('Using content cache');
		data = contentCache;
	} else {
		console.log('Not using content cache');
		data = await processMarkdownFiles(hotURLCache);
		if ($build[0]) contentCache = data;
	}

	// const { folder: website, finalCache } = await processMarkdownFiles(initialCache);
	const { folder: website } = data;

	if (JSON.stringify(initialURLCache) !== JSON.stringify(hotURLCache)) {
		writeCache(hotURLCache, $home[0]);
	}

	const folderName = basename($home[0]);

	return { website, homeDir: $home[0], folderName, files, dev };
}
