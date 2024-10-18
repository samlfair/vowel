import { XMLParser } from "fast-xml-parser"
import urlMetadata from 'url-metadata';

export default async function getMetadata({ cache, url }) {
	if (!cache[url]) {
		try {
			const urlObject = new URL(url);
			const allMetadata = await urlMetadata(urlObject.href, {
				includeResponseBody: true,
				ensureSecureImageRequest: true
			});

			const parser = new XMLParser({
				unpairedTags: ["!doctype", "meta", "link", "hr", "br", "img"],
				ignoreAttributes: false,
				stopNodes: ["*.pre", "*.script"],
				processEntities: true,
				htmlEntities: true
			})
	
			let parsedData = parser.parse(allMetadata.responseBody)
			const webmentionEndpoint = parsedData?.html?.head?.link?.find(link => {
				return link["@_rel"] === "webmention"
			})?.["@_href"]

			const metadata = {
				image: allMetadata['og:image'],
				ogURL: allMetadata['og:url'],
				canonicalURL: allMetadata.canonical,
				title: allMetadata.title,
				ogTitle: allMetadata['og:title'],
				author: allMetadata.author,
				description: allMetadata.description,
				webmentionEndpoint
			};

			cache[url] = metadata;

			return { metadata }
		} catch (error) {
			console.log({ fetchingMetadataError: error })
			return { metadata: undefined }
		}
	}
	return { metadata: cache[url] }
}