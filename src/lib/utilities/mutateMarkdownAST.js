import urlMetadata from 'url-metadata';

export default async function mutateMarkdownAST(ast, cache) {
	const promises = ast.map(async (node) => {
		// TODO: Improve this URL regex
		if (node.type === 'paragraph') {
			// URLs
			if (
				node.children?.length === 1 &&
				node.children[0]?.value?.match(/^https?:\/\/\S+$/) &&
				!node.children[0]?.children
			) {
				node.type = 'url';
				const url = node.children[0].value;
				if (!cache[node.value]) {
					try {
						const urlObject = new URL(url);
						const response = await urlMetadata(urlObject.href, {
							includeResponseBody: false,
							ensureSecureImageRequest: true
						});

						const metadata = {
							image: response['og:image'],
							ogURL: response['og:url'],
							canonicalURL: response.canonical,
							title: response.title,
							ogTitle: response['og:title'],
							author: response.author,
							description: response.description
						};

						cache[url] = metadata;
						node.metadata = metadata;
						node.value = url;

						delete node.children;
					} catch (error) {
						node.value = url;
						// console.log(`Error on URL in content: ${url}`);
					}
				} else {
					node.metadata = cache[node.value];
				}
			} else if (node.children[0].type === 'image') {
				node.type = 'figure';
				if (node?.children[1]?.type === 'text') {
					node.children[1].type = 'figcaption';
				}
			}
		}

		if (node.children) {
			await mutateMarkdownAST(node.children, cache);
		}
	});

	await Promise.all(promises);
}
