import urlMetadata from 'url-metadata';
import { sendWebmention } from './';

function isURL(string) {
	try {
		new URL(string)
		return true
	} catch (e) {
		return false
	}
}

export default async function mutateMarkdownAST(ast, cache, webmentions, pageURL) {

	const promises = ast.map(async (node) => {
		// TODO: Improve this URL regex
		if (node.type === 'paragraph') {

			// URLs
			if (
				node.children?.length === 1 &&
				node.children?.[0]?.type === "link" &&
				node.children?.[0]?.children?.length === 1
			) {
				node.type = 'url';
				const { url } = node.children[0];
				node.url = url
				if (!cache[node.url]) {
					try {
						const urlObject = new URL(url);
						const response = await urlMetadata(urlObject.href, {
							includeResponseBody: true,
							ensureSecureImageRequest: true
						});

						console.log(!!webmentions)
						console.log({ webmentions })
						console.log(webmentions.find(webmention => webmention.target === url))


						if (webmentions && !webmentions.find(webmention => webmention.target === url)) {
							webmentions.push({
								target: url,
								status: "new"
							})
						} else if (webmentions) {
							const webmention = webmentions.find(webmention => webmention.target === url)
							if (webmention.status === "new") {
								webmention.status = await sendWebmention({ body: response.responseBody, target: webmention.target, source: pageURL })
							}
						}

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
					}
				} else {
					node.metadata = cache[url];
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
