import xml from "xml"
import { listPages } from "./../../utils.js"
import { entryContent } from "./entryContent.js"

/** @import * as Votive from "votive" */


/**
 * `sitemap.xml` and `feed.xml` exist exactly while a `domain` is
 * configured. They used to be created from the markdown plugin's
 * readFile when it happened to be reading settings.md, and each write
 * then had to answer "should I exist?" with `{delete: true}`. Declaring
 * them here moves that question to the one place that can answer it
 * cheaply, and deleting a domain now removes both targets and both files
 * by the ordinary rule.
 *
 * `params` carries the domain so the stub re-expands when it changes;
 * the writes read it from settings, tracked, so they rerun too.
 * @type {Votive.ProcessorStubs}
 */
function createStubs({ settings }) {
  const domain = settings.lastNonNull("fm_domain")
  if (!domain) return []
  return [
    { path: "sitemap.xml", params: { domain } },
    { path: "feed.xml", params: { domain } }
  ]
}

/**
 * Both files are generated wholesale by writeFile from live listings, so
 * there is no meaningful source text - the stub exists to give each one a
 * source, and therefore a lifetime.
 * @type {Votive.ProcessorExpand}
 */
function expandStubs() {
  return { text: "" }
}

/**
 * Reads the domain a write should use. Taken from settings rather than
 * from metadata stamped onto the target at creation: the stub declares
 * the file's *existence*, and settings are the live value, so changing
 * the domain restales both writes through the ordinary settings
 * dependency instead of needing the creator to run again.
 */
function resolveDomain(settings) {
  const domain = settings.lastNonNull("fm_domain")
  if (!domain) return null
  return String(domain).startsWith("http") ? String(domain) : "http://" + domain
}

const DEFAULT_FEED_LIMIT = 20

/** @type {Votive.VotiveProcessor} */
const processor = {
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
  extensions: [".xml"],
  format: "text",
  createStubs,
  expandStubs,
  // An .xml source carries nothing worth inferring; writeFile generates
  // the whole document.
  readFile: (source) => ({ data: source.text, metadata: {} }),
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

      // No {delete: true} any more: this target exists only because the
      // enumerator declared it, and it does that only when a domain is
      // set. Removing the domain un-declares the stub, and votive deletes
      // the row and the file by the same rule it deletes a page whose
      // source was removed. Nothing deletes itself.
      const domain = resolveDomain(settings)
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
        data: sitemap
      }

    } else if (target.path === "feed.xml") {

      // The most recent entries, not every dated page the site has
      // ever published: a feed is what changed lately, and a reader
      // fetches it hourly. It is also what keeps an edit cheap - every
      // entry's content is its rendered body, parsed out of the page,
      // and the feed used to re-render all of them (800 pages: 850 ms,
      // on every edit to any of them). Cut after listPages' own filter,
      // so a hidden or virtual page in the top twenty doesn't cost the
      // feed an entry; the rows are cheap, only `data` is not, and only
      // the entries kept read it. `feed_limit` in settings.md raises or
      // lowers it.
      const limit = Number(settings.lastNonNull("fm_feed_limit")) || DEFAULT_FEED_LIMIT
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
        .slice(0, limit)

      // Same rule as the sitemap: every <id> and <link> is absolute, and
      // Atom requires <id> to be an absolute IRI. Without a domain this
      // branch used to emit the literal string "http://undefined/feed".
      const domain = resolveDomain(settings)
      if (!domain) return { data: "" }

      const feed = [];

      feed.push(
        {
          _attr: {
            xmlns: 'http://www.w3.org/2005/Atom'
          }
        },
        {
          title: settings.raw("fm_name")?.[0]?.at(-1)
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

      const feedAuthor = settings.lastNonNull("fm_author")
      if (feedAuthor)
        feed.push(
          {
            author: {
              name: feedAuthor
            }
          },
          { rights: `Copyright (c) ${new Date().getFullYear()} ${feedAuthor}` }
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
