export const prerender = true;

export async function GET({}) {
    const body = [
        {
            path: "/notes",
            webmentions: [
				{
					target: "https://vowel.cc/about",
					success: true,
					error: undefined

				}
			]
        }
    ]


	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/plain'
	};

	const response = new Response(JSON.stringify(body), {
		headers
	});
	return response;
}
