import urlMetadata from 'url-metadata';
import { regexPatterns, isObject, parseDate, sendWebmention, getMetadata } from '.';

/**
 * Description
 * @param {any} value - Any frontmatter value
 * @returns {any}
 */
function imputeType(value) {
	if (value === null || value === undefined || Number.isNaN(value)) return 'nullish';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'number') return 'number';
	if (parseDate(value)) return 'date';
	if (isObject(value)) return 'object';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'string') {
		if (value.match(regexPatterns.img)) return 'image';
		if (value.match(regexPatterns.pdf)) return 'pdf';
		if (value.match(regexPatterns.url)) return 'url';
		if (value.match(regexPatterns.path)) return 'path';
		return 'string';
	}
	console.error('Unknown frontmatter data type: ' + value);
	return 'other';
}

export default async function mutateMarkdownFrontmatter(frontmatter, cache, webmentions, pageURL) {
	const keys = Object.keys(frontmatter);

	const promises = keys.map(async (key) => {
		const input = frontmatter[key];

		const type = imputeType(input);

		switch (type) {
			case 'object': {
				await mutateMarkdownFrontmatter(input, cache);
				frontmatter[key] = {
					type: 'object',
					output: input
				};
				break;
			}
			case 'array': {
				await mutateMarkdownFrontmatter(input, cache);
				frontmatter[key] = {
					type: 'array',
					output: input
				};
				break;
			}
			case 'date': {
				frontmatter[key] = {
					type: 'date',
					output: parseDate(input),
					input
				};
				break;
			}
			case 'image': {
				frontmatter[key] = {
					type: 'image',
					output: input,
					input
				};
				break;
			}
			case 'pdf': {
				frontmatter[key] = {
					type: 'pdf',
					output: input,
					input
				};
				break;
			}
			case 'url': {
				const { metadata } = await getMetadata({
					cache,
					url: input
				})

				frontmatter[key] = {
					type: 'url',
					output: metadata || input,
					input
				};

				try {
					if (webmentions && !webmentions.find(webmention => webmention.target === input)) {
						webmentions.push({
							target: input,
							status: "new"
						})
					} else if (webmentions) {
						const webmention = webmentions.find(webmention => webmention.target === input)
						if (webmention.status === "new") {
							webmention.status = await sendWebmention({ endpoint: metadata.webmentionEndpoint, target: webmention.target, source: pageURL })
						}
					}

				} catch (error) {
					console.log({ webmentionsError: error })
				}
				break;
			}
			case 'nullish': {
				frontmatter[key] = undefined;
			}
		}
	});

	await Promise.all(promises);
}
