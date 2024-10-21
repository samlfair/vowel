import { sendWebmention, getMetadata } from './';

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

				const { metadata } = await getMetadata({ cache, url })

				node.metadata = metadata;
				node.value = url;
				delete node.children;

				try {
					console.log("Looking for webmentions")
					if (webmentions && !webmentions.find(webmention => webmention.target === url)) {
						console.log("Found new page")
						webmentions.push({
							target: url,
							status: "new"
						})
					} else if (webmentions) {
						console.log("Found new webmention")
						const webmention = webmentions.find(webmention => webmention.target === url)
						if (webmention.status === "new" || webmention.status === "failure" || webmention.status === "429") {
							console.log("Sending webmention")
							webmention.status = await sendWebmention({ endpoint: metadata.webmentionEndpoint, target: webmention.target, source: pageURL })
						}
					}
				} catch (error) {
					console.log({ webmentionError: error })
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
