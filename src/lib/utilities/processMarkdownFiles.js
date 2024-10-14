import fs from 'fs/promises';
import path from 'path';
// @ts-ignore
import { buildURL, checkFileExists, readMarkdownFile } from '.';

function DefaultFile(url) {
	return {
		ast: [
			{
				type: 'paragraph',
				children: [
					{
						type: 'h1',
						value: 'hey there',
						// value: url + '?count=10',
						position: {
							start: {
								line: 5,
								column: 1,
								offset: 25
							},
							end: {
								line: 5,
								column: 8,
								offset: 32
							}
						}
					}
				],
				position: {
					start: {
						line: 5,
						column: 1,
						offset: 25
					},
					end: {
						line: 5,
						column: 8,
						offset: 32
					}
				}
			}
		],
		url
	};
}

function DefaultDirectory(path) {
	return {
		$: DefaultFile(path),
		_: DefaultFile(path)
	};
}

/** @typedef {Object} AdditionalFileProperties
 * @property {string} [url] - URL to the page for the file.
 * @property {number} [date] - Document date.
 */

/** @typedef {import("./readMarkdownFile").ParsedMarkdown & AdditionalFileProperties} MarkdownFile */

/**
 * @typedef {Object} Subdirectory
 * @description A subdirectory of markdown files
 * @property {MarkdownFile} $ A home file
 * @property {MarkdownFile} _ A settingsfile
 * @property {Object.<string, Object>} [additionalProps] Files or child directories.
 */

/**
 * @typedef {Object.<string, MarkdownFile | Subdirectory>} Directory
 * @description A directory of markdown files
 * @property {MarkdownFile} $ A home file.
 * @property {MarkdownFile} _ A settings file.
 * @property {Object.<string, MarkdownFile | Subdirectory>} [additionalProps] Files or child directories.
 */

/**
 * Recursively read a directory of markdown files and return an object of the files.
 * @param {string} directoryPath - The directory to read.
 * @param {string} parents - A string representing the parent directories.
 * @param {import('./loadCache').Cache} cache
 * @returns {Promise<Directory>}
 */

/**
 * Recursively read a directory of markdown files and return an object of the files.
 * @param {string} folderPath - The directory to read.
 * @param {string} parents - A string representing the parent directories.
 * @param {import('./loadCache').Cache} cache
 * @returns {Promise<Directory>}
 */
async function readFolder(folderPath, parents, cache, hidden) {
	function filterFiles(file) {
		if (file.name.startsWith('.')) return false;
		if (file.name.startsWith('README')) return false;
		if (file.isFile() && !file.name.endsWith('.md')) return false;
		if (file.name === 'node_modules') return false;
		if (file.name === 'assets') return false;
		if (file.name === 'templates') return false;
		return true;
	}

	let files = (await fs.readdir(folderPath, { withFileTypes: true })).filter(filterFiles);

	console.log(`filesfound:${files.length}`);

	const promises = files.map(
		async (file) => await readFile(file, parents, cache, folderPath, hidden)
	);

	const folder = (await Promise.all(promises)).reduce((acc, obj) => ({ ...acc, ...obj }), {});

	if (typeof folder === 'object' && !folder?.$) {
		folder.$ = DefaultFile(parents || '/');
		folder.$.imputedProperties = {
			fileName: parents.split('/').at(-1) || 'Home'
		};
	}

	if (typeof folder === 'object' && !folder?._) {
		folder._ = DefaultFile(parents);
	}

	return folder;
}

async function readFile(file, parents, cache, folderPath, hidden) {
	const route = path.parse(file.name).name;
	const url = buildURL(parents, route);
	const filePath = path.join(folderPath, file.name);

	const extension = path.extname(file.name);

	const hide = (file.name.startsWith('$') && file.name.length > 1) || hidden;

	if (file.isFile() && extension === '.md') {
		const startLoad = performance.now();
		const shortPath = parents + '/' + file.name;

		const { ast, frontmatter, imputedProperties } = await readMarkdownFile(filePath, cache);
		const loadTime = (performance.now() - startLoad).toFixed(2);
		// console.log(`📄 ${shortPath} (${loadTime}ms)`);
		console.log('fileread');
		if (frontmatter.published == false) return;
		if (file.name === 'home.md' || file.name === 'settings.md') {
			const key = file.name === 'home.md' ? '$' : '_';
			return {
				[key]: {
					...frontmatter,
					imputedProperties,
					ast,
					url
				}
			};
		}

		return {
			[route]: {
				$: {
					...frontmatter,
					imputedProperties,
					ast,
					// url,
					url: hide ? false : url
				}
			}
		};
	}

	/** @type Directory */
	if (file.isDirectory()) {
		const settingsPath = path.join(folderPath, file.name, 'settings.md');
		const settingsFileExists = await checkFileExists(settingsPath);

		/** @type {MarkdownFile} */
		const _ = settingsFileExists ? await readMarkdownFile(settingsPath, cache) : DefaultFile(url);

		const shortPath = parents + '/' + file.name;

		const startLoad = performance.now();
		const folder = await readFolder(path.join(folderPath, file.name), url, cache, hide);

		const loadTime = (performance.now() - startLoad).toFixed(2);
		// console.log(`📁 ${shortPath} (${loadTime}ms)`);

		if (!folder.hasOwnProperty('$')) {
			const $ = DefaultFile(url);
			Object.assign(folder, { $ });
		}
		if (!folder.hasOwnProperty('_')) {
			const _ = DefaultFile(url);
			Object.assign(folder, { _ });
		}

		return {
			[file.name]: folder
		};
	}
}

/**
 * @typedef {Object} ProcessedFiles
 * @description The return value of the processing function.
 * @property {Directory} folder - The root directory.
 * @property {Cache} finalCache - The application cache.
 */

/**
 * Recursively reads the markdown files in a directory and returns a representative object.
 * @param {import('./loadCache').Cache} cache
 * @returns {Promise<ProcessedFiles>}
 */
export default async function processMarkdownFiles(cache) {
	/** @type {Array<string>} */
	// @ts-ignore
	const [homeDir] = $home;
	const folder = await readFolder(homeDir, '', cache);

	console.log('loaded');

	return { folder, finalCache: cache };
}
