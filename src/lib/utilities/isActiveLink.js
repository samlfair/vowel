export default function isActiveLink(segments, key) {
	if (!segments?.[0] && !key) {
		return 'page';
	}
	if (segments.length === 1 && segments[0] === key) {
		return 'page';
	}
	if (segments.length > 1 && segments[0] === key) {
		return 'true';
	}
	return undefined;
}
