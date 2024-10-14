export default function getFolder(website, path) {
	const dotPath = path
		.replace(/^\//, '') // Remove preceding slash
		.replace(/\/$/, '') // Remove trailing slash
		.replaceAll('/', '.'); // Convert to dots

	let drill = website;

	dotPath.split('.').forEach((segment) => {
		if (segment) {
			drill = drill[segment];
		}
	});

	return drill;
}
