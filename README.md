# Vowel

*Markdown websites in milliseconds*

- Bundled with [Votive](https://github.com/samlfair/votive)
- Served with [Voot](https://github.com/samlfair/voot)

## Roadmap

### High priority

- [x] Global nav
- [x] Breadcrumbs
- [ ] More file handling plugins
  - [ ] Fonts
    - [x] .woff
    - [x] .woff2
    - [x] .ttf
    - [x] .otf
    - [ ] Handling
  - [ ] Images
    - [x] .png
    - [x] .jpg
    - [x] .jpeg
    - [x] .webp
    - [x] .gif
    - [ ] Formatting
  - [ ] Icons
    - [x] .ico
  - [ ] Vectors
    - [x] .svg
  - [ ] Styles
    - [x] .css
    - [ ] Bundling
  - [ ] PDFs
  - [ ] Videos
  - [ ] Arbitrary data
- [ ] Add homepage to global nav
- [ ] Page lists
- [ ] Dates
- [ ] robots.txt
- [ ] sitemap.xml
- [ ] 404.html
- [ ] Better URL normalization (see notes)
- [ ] Name casing
- [ ] TUI
  - [ ] Create settings.md
    - [ ] Site title
    - [ ] Domain
    - [ ] Webmentions
    - [ ] Logo
    - [ ] Wordmark
    - [ ] Identity (rel=me)
    - [ ] Filename breadcrumbs
    - [ ] RSS
    - [ ] Sitemap
  - [ ] Create home.md
  - [ ] Create folder settings files
    - [ ] Title
    - [ ] Breadcrumb
- [x] Custom CSS
  - [ ] styles.css
  - [ ] Any CSS file
- [ ] Tags
- [ ] Customize index fallback
- [ ] OR remove index fallback
- [ ] Date format settings
- [ ] ::mark::
- [ ] Infer images
- [ ] Favicon
- [ ] Webmentions
- [x] HTML boilerplate
- [ ] View transitions
- [ ] Logo
- [ ] Wordmark
- [ ] Sort nav items
- [ ] Canonical URL
- [ ] Handle external links
- [ ] Admonitions
- [ ] Use hgroup for site title, page title, etc
- [ ] Images as `<figure>`
- [ ] Hidden routes
- [ ] Frontmatter settings
  - [ ] HTML
  - [ ] RSS
  - [ ] Sitemap
- [ ] Heading anchors
- [ ] Taxonomy pages and smart frontmatter
- [ ] CSS cache busting
- [ ] Slogan in homepage title
- [ ] GFM emojis (:smile:)

### Medium priority

- [ ] Tests
- [ ] Break code into multiple files
- [ ] Image optimization (unpic)
- [ ] [SVG by mask](https://pqina.nl/blog/set-svg-background-image-fill-color/) and [CSS icons](https://antfu.me/posts/icons-in-pure-css)
- [ ] WYSIWYG editor
- [ ] Better signals
  - [ ] File-written callback
- [ ] Themes
- [ ] Deploy
  - [ ] Cloudflare pages
  - [ ] GitHub pages
- [ ] Post-publish work (ping webmentions)
- [ ] [Desktop app](https://blackboard.sh/electrobun/docs/)
- [ ] Mermaid
- [ ] Codeblock syntax highlighting
- [ ] Extraction utilities (regex in archive)
- [ ] Smarter frontmatter
  - [ ] Object dl
  - [ ] Array ul
  - [ ] Image
  - [ ] URL
  - [ ] Date
- [ ] TOC
- [ ] Versioning/publishing script
- [ ] Verify all element types form Obsidian
- [ ] Order/position/kanban
- [ ] Banner
- [ ] CTA
- [ ] Menu toggle
- [ ] Icons sets
- [ ] Auto-icons (:fa-rocket:)
- [ ] Frontmatter icons

### Low priority

- [ ] Footnotes
- [ ] Frontmatter taxonomies
- [ ] Recursive frontmatter
- [ ] Browser search
- [ ] Pagination
- [ ] Dialogue/spoiler alert
- [ ] Copy code button
- [ ] Tabbed element
- [ ] Multi-lingual
- [ ] Routing rules (see notes)
- [ ] ATProto
  - [ ] Liking
  - [ ] Commenting
- [ ] More inferred properties
  - [ ] Email
  - [ ] Phone number
  - [ ] Location
  - [ ] Color
  - [ ] Price
  - [ ] ISBN
- Contact form
- Subscription form
- Faceted search

## Notes and questions

rel=author? rel=bookmark? rel=external?


Annotations (see notes)


Interactivity (see notes)

Calculated properties?


OG tags to consider:

```
  
  /*
    og:type - The type of your object, e.g., "video.movie". Depending on the type you specify, other properties may also be required.
    og:locale - The locale these tags are marked up in. Of the format language_TERRITORY. Default is en_US.
    article:published_time - datetime - When the article was first published.
    article:modified_time - datetime - When the article was last changed.
    article:expiration_time - datetime - When the article is out of date after.
    article:author - profile array - Writers of the article.
    article:section - string - A high-level section name. E.g. Technology
    article:tag - string array - Tag words associated with this article.
  */
```
