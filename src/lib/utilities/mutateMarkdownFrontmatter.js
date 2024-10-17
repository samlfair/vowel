import urlMetadata from 'url-metadata';
import { regexPatterns, isObject, parseDate, sendWebmention } from '.';

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

export default async function mutateMarkdownFrontmatter(frontmatter, cache, webmentions) {
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

				if (!cache[input]) {
					try {
						const url = new URL(input);
						const metadata = await urlMetadata(url.href, {
							includeResponseBody: true,
							ensureSecureImageRequest: true
						});

						const selectedMetadata = {
							url: metadata.url,
							canonical: metadata.canonical,
							title: metadata.title,
							image: metadata.image,
							favicons: url.favicons,
							og_url: url['og:url'],
							og_title: url['og:title'],
							og_description: url['og:description'],
							og_site_name: url['og:side_name'],
							og_image: url['og:image']
						};

						if(webmentions && !webmentions.find(webmention => webmention.target === input)) {
							webmentions.push({
								target: input,
								status: "new"
							})
						} else if (webmentions) {
							const webmention = webmentions.find(webmention => webmention.target === input)
							if(webmention.status === "new") {
								webmention.status = await sendWebmention(metadata.responseBody)
							}
						}


						cache[input] = selectedMetadata;

						frontmatter[key] = {
							type: 'url',
							output: selectedMetadata,
							input
						};
					} catch (e) {
						console.error(`Error on URL in frontmatter: ${frontmatter[key]}`);
						frontmatter[key] = {
							type: 'string',
							output: input,
							input
						};
					}
				} else {
					frontmatter[key] = {
						type: 'url',
						output: cache[input],
						input
					};
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
