import { processMarkdownFiles, loadCache } from '../../lib/utilities';

/*
	TODO: Will this work at this location? Otherwise, figure out how to move it.
*/

const allow = `Allow: /`;
const disallow = `Disallow: /`;

const google_images = `User-agent: Googlebot-Image`;

const google_general = `User-agent: Google-Extended`;

const gpt_bot = `User-agent: GPTBot`;

const gpt_user = `User-agent: ChatGPT-User`;

const common_crawl = `User-agent: CCBot`;

export const prerender = true;

export async function GET({}) {
	/*
    It's wasteful to load everything here, but it should only run
    once at buildtime, so it's not a significant issue.
  */
	const initialCache = await loadCache($home[0]);

	const { folder: website } = await processMarkdownFiles(initialCache);

	const declarations = [];

	declarations.push(
		google_general + '\n' + (website._.robots?.google === false ? disallow : allow)
	);
	declarations.push(
		google_images + '\n' + (website._.robots?.google_images === false ? disallow : allow)
	);
	declarations.push(gpt_bot + '\n' + (website._.robots?.ai === false ? disallow : allow));
	declarations.push(gpt_user + '\n' + (website._.robots?.ai === false ? disallow : allow));
	declarations.push(common_crawl + '\n' + (website._.robots?.ai === false ? disallow : allow));

	const text = declarations.join('\n\n') || '';

	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/plain'
	};

	const response = new Response(text, {
		headers
	});
	return response;
}
