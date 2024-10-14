const pathRegex = /^\/[\/\$\w\d=-_\.\?&-]*$/;

export function getFolderAndCount(node) {
	if (
		node.type === 'paragraph' &&
		node.children.length === 1 &&
		node.children[0].type === 'text' &&
		(node.children[0].value.match(pathRegex) || node.children[0].value.match(/^\/$/))
	) {
		const urlObject = new URL(node.children[0].value, 'https://placeholder.getvowel.com');
		const isFolder = urlObject.searchParams.get('count');
		const property = urlObject.searchParams.get('property');
		const content = urlObject.searchParams.get('content') === 'true';
		if (isFolder) return { count: isFolder, path: urlObject.pathname, property, content };
	}
	return false;
}

export function isFileLink(node) {
	if (
		node.type === 'paragraph' &&
		node.children.length === 1 &&
		node.children[0].type === 'text' &&
		node.children[0].value.match(pathRegex)
	) {
		return true;
	}
	return false;
}
