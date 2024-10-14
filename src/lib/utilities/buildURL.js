/**
 * Build a URL for a file.
 * @param {string} parents - Parent URL.
 * @param {string} route - Filename.
 * @returns {string} - URL for the file.
 */
export default function buildURL(parents, route) {
	if (!parents) {
		if (route === 'home' || route === 'settings') {
			return '/';
		}
		return '/' + route;
	}
	if (route === 'home' || route === 'settings') {
		return parents;
	}
	return parents + '/' + route;
}
