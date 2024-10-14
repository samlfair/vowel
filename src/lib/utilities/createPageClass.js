export default function createPageClass(url, type = 'page') {
	if (!url) return 'item';
	if (url === '/') return `page home`;
	if (type === 'page') return `page ${url.split('/').join(' ')}`;
	return type + url.split('/').join(' ');
}
