export default function createFolderClass(url) {
	if (url === '/') return 'folder-root';
	return 'folder' + url.replaceAll('/', '-');
}
