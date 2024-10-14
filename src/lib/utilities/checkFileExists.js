import fs from 'fs/promises';
// import { constants as fsConstants } from 'fs';

/**
 * Description
 * @param {string} folderPath - File page for a document.
 * @returns {Promise<boolean>}
 */
export default async function checkFileExists(folderPath) {
	try {
		await fs.access(folderPath);
		return true; // Folder exists
	} catch (error) {
		return false; // Folder does not exist
	}
}
