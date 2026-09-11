import xml from "xml"
import { listPages } from "./../../utils.js"
import { entryContent } from "./entryContent.js"

/** @import * as Votive from "votive" */


/** @type {Votive.VotiveProcessor} */
const processor = {
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  extensions: [".xml"],
  format: "text",
  writeFile: (target, { settings, api }) => {
    if (target.path === "sitemap.xml") {
      // FIXME move the filter to SQLite
      const pages = api
        .targets({
          folder: "",
          recursive: true,
          query: {
            "!": {
              "|": {
                "sitemap_item": false,
                "html_file": false
              }
            }
          },
        })
        .filter(a => a.extension === ".html" && a.path)

      const domain = target.metadata.domain
        && target.metadata.domain.startsWith("http")
        ? target.metadata.domain
        : "http://" + target.metadata.domain

      // Every <loc> is absolute, so without a domain there is no sitemap
      // to write - not an empty one. { delete: true } removes the target
      // and its file, which is the honest answer for "this shouldn't
      // exist"; an empty file would be served and crawled.
      if (!target.metadata.domain) return { delete: true }

      function createEntry(page) {
        const url = new URL(page.path, domain)
        const entry = `<url><loc>${url.href}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
        return entry
      }

      function createSitemap(pages, domain) {
        const entries = pages.map(createEntry).join('')
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
    ${entries}
</urlset>`
      }

      const sitemap = createSitemap(pages, domain)

      return {
        data: sitemap
      }

    } else if (target.path === "feed.xml") {

      const pages = listPages(api, {
        query: {
          "!": {
            rss_item: false
          }
        },
        folder: "",
        recursive: true,
        orderBy: { property: "date", direction: "desc" }
      })
        .filter(a => a.metadata.date)

      // Same rule as the sitemap: every <id> and <link> is absolute, and
      // Atom requires <id> to be an absolute IRI. Without a domain this
      // branch used to emit the literal string "http://undefined/feed".
      if (!target.metadata.domain) return { delete: true }
      const domain = target.metadata.domain.startsWith("http")
        ? target.metadata.domain
        : "http://" + target.metadata.domain

      const feed = [];

      feed.push(
        {
          _attr: {
            xmlns: 'http://www.w3.org/2005/Atom'
          }
        },
        {
          title: target.metadata.title
        },
      )


      feed.push(
        {
          link: {
            _attr: {
              rel: 'self',
              href: `${domain}/feed`
            }
          }
        },
        {
          id: `${domain}/feed`
        }
      );

      if (target.metadata.author)
        feed.push(
          {
            author: {
              name: target.metadata.author
            }
          },
          { rights: `Copyright (c) ${new Date().getFullYear()} ${target.metadata.author}` }
        );

      feed.push(
        ...pages.map((page) => {
          const url = (new URL(page.path, domain)).href

          /** @type {object[]} */
          const entry = [
            {
              title: page.metadata.title
            },
            {
              link: {
                _attr: {
                  rel: 'alternate',
                  href: url
                }
              }
            },
            { id: url },
            { updated: page.metadata.date }
          ];

          if (page.metadata.description) {
            entry.push({
              summary: page.metadata.description
            });
          }

          if (page.metadata.author) {
            entry.push({
              author: {
                name: page.metadata.author
              }
            });
          }

          // The post body, not the page: entryContent pulls
          // <section id=content> out of the rendered HTML and makes every
          // URL absolute, because a reader resolves /necklace.jpg against
          // its own host. type="html" is required by Atom for a content
          // element holding markup - without it a reader may show the
          // tags as text.
          const content = entryContent(page.data, domain)
          if (content) {
            entry.push({
              content: [
                { _attr: { type: "html" } },
                content
              ]
            })
          }

          return {
            entry
          };
        })
      );

      const xmlFeed = xml({ feed }, { declaration: true })


      return {
        data: xmlFeed
      }
    } else {
      return {
        data: ""
      }
    }
  }
}

/** @type {Votive.VotivePlugin} */
const vowelXMLPlugin = {
  name: "vowel-xml",
  processors: [processor]
}

export default vowelXMLPlugin
