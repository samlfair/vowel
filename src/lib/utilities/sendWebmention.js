import { XMLParser } from "fast-xml-parser"


export default async function sendWebmention({ body, source, target }) {
    try {
        const parser = new XMLParser({
            unpairedTags: ["!doctype", "meta", "link", "hr", "br", "img"],
            ignoreAttributes: false,
            stopNodes: ["*.pre", "*.script"],
            processEntities: true,
            htmlEntities: true
        })

        let parsedData = parser.parse(body)
        const webmentionEndpoint = parsedData?.html?.head?.link?.find(link => {
            return link["@_rel"] === "webmention"
        })?.["@_href"]

        if (webmentionEndpoint) {
            const params = new URLSearchParams()
            params.append('source', source)
            params.append('target', target)


            const response = await fetch(webmentionEndpoint, {
                method: "POST",
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            if(response.status === 429) {
                return "429"
            } else if (response.status >= 200 && response.status < 300) {
                return "success"
            } else {
                return "failure"
            }
        }
    } catch (e) {
        console.log(e)
        return "error"
    }
}