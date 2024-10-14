import { getPagesByFolder, processMarkdownFiles, loadCache } from '../../lib/utilities';

export const prerender = true;

export async function GET({}) {
	const fallback = {
		folder: {}
	};

	const initialCache = await loadCache($home[0]);

	const { folder: website } = await processMarkdownFiles(initialCache);

	const pages = getPagesByFolder(website, '/');

	const site_title = {
		title: website._.title || 'Untitled'
	};

	const domain = website._.domain || false;

	function createEntry(page) {
		return `
		<url>
			<loc>${new URL(page.url || '/', domain)}</loc>
			<changefreq>daily</changefreq>
			<priority>0.7</priority>
		</url>
		`;
	}

	function createSitemap(pages, domain) {
		return `<?xml version="1.0" encoding="UTF-8" ?>
	<urlset
  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="https://www.w3.org/1999/xhtml"
  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
  <url>
    <loc>${domain}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
	  ${pages.map(createEntry).join('')}
</urlset>
  `;
	}

	function createFallBackSitemap() {
		return `<?xml version="1.0" encoding="UTF-8" ?><message>Specify a 'domain' in /settings.md</message>`;
	}

	const sitemap = domain ? createSitemap(pages, domain) : createFallBackSitemap();

	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/xml'
	};

	const response = new Response(sitemap, {
		headers
	});

	return response;
}
