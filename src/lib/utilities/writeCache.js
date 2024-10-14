import fs from 'fs/promises';
import { resolveHomeDirPath } from '.';

export default async function writeCache(data, homeDir) {
	console.log({ data });
	const cachePath = resolveHomeDirPath('.cache.json', homeDir);

	try {
		const jsonData = JSON.stringify(data, null, 2);
		await fs.writeFile(cachePath, jsonData, 'utf8');
		console.log('Cache updated');
	} catch (error) {
		console.error('Error updating cache data:', error);
	}
}
