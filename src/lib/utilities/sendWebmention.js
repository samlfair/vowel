export default async function sendWebmention({ endpoint, source, target }) {
    try {
        if (endpoint) {
            const params = new URLSearchParams()
            params.append('source', source)
            params.append('target', target)

            const response = await fetch(endpoint, {
                method: "POST",
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            console.log({
                source, target,
                webmentionResponse: await response.json()
            })

            if(response.status === 429) {
                return "429"
            } else if (response.status >= 200 && response.status < 300) {
                return "success"
            } else {
                console.log({ failure: await response.json() })
                return "failure"
            }
        }
    } catch (error) {
        console.log({ error })
        return "error"
    }
}