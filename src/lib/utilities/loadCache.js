import fs from 'fs/promises';
import resolveHomeDirPath from './resolveHomeDirPath';

/**
 * @typedef {Object<string, object>} Cache
 * @description A map of URLs to their metadata.
 */

/**
 * Load a cache of URLs
 * @returns {Promise<Cache>}
 */
export default async function loadCache(homeDir) {
	const cachePath = resolveHomeDirPath('.cache.json', homeDir);

	try {
		let data = await fs.readFile(cachePath);
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			await fs.writeFile(cachePath, '{}', 'utf8');
			console.log('.cache.json created');
		} else {
			throw error;
		}
	}
	return {};
}
