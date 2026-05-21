import xml from "xml"

/** @import * as Votive from "votive" */


/** @type {Votive.VotiveProcessor} */
const processor = {
  extensions: [".xml"],
  format: "text",
  writeFile: (target, database) => {
    if (target.path === "sitemap.xml") {

      // FIXME move the filter to SQLite
      const pages = database.target
        .getManyWithTrackers({
          folder: "",
          recursive: true,
          query: {},
          dependent: "sitemap.xml"
        })
        .filter(a => a.syntax === ".html" && a.path)

      const domain = target.metadata.domain
        && target.metadata.domain.startsWith("http")
        ? target.metadata.domain
        : "http://" + target.metadata.domain

      // FIXME allow falsey returns from writeFile to abort write
      if (!domain) return { data: "" }

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
        data: sitemap,
        jobs: []
      }

    } else if (target.path === "feed.xml") {

      const pages = database.target.getManyWithTrackers({
        query: {},
        folder: "",
        recursive: true,
        dependent: "feed.xml"
      })
        .filter(a => a.metadata.date)
        .sort((a, b) => b.metadata.date - a.metadata.date)

      const domain = target.metadata.domain
        && target.metadata.domain.startsWith("http")
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
        }
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

          // TODO consider rendering full page in RSS

          /*
          entry.push({
            content: [
              { _attr: { type: 'html' } },
              render(Page, { props: { page, level: 0, format: 'rss' } }).html
            ]
          });
          */

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
  processors: [processor],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelXMLPlugin
