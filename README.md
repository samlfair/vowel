# Vowel

*Markdown websites in milliseconds*

- Bundled with [Votive](https://github.com/samlfair/votive)
- Served with [Voot](https://github.com/samlfair/voot)

See the docs: [vowel.cc](https://vowel.cc).

## Roadmap

### Launch checklist

- [x] CLI
- [x] Docs
- [x] Classes
- [x] Route patterns
- [x] Post list metadata
- [.] Transaction management

- [.] Fixes
  - [x] Global nav sublinks
  - [x] Hot reload
  - [.] Explicit asset handling
  - [.] Change "job" to "resources"
    - [.] ReadResource types
  - [.] Processor utilities param
  - [.] Delete old SQLite logic
  - [.] Make metadata explicit in SQLiteTarget type
  - [x] Add SQLite begin/commit logic
  - [.] Remove "loadDatabase"
  - [.] Check all types
- [.] File handling
  - [x] CSS prefixing
  - [x] Homepage in global nav
  - [x] Metadata in header
  - [x] Page list sort
  - [.] Limit in sort
- [x] Metafiles
  - [x] Robots.txt
  - [x] Sitemap.xml
  - [x] RSS
  - [ ] 404.html (just make 404.md)
- [ ] Markup
  - [.] Image as figure
  - [x] Admonitions
  - [x] Heading anchors
  - [ ] GFM emoji
  - [ ] Mermaid
  - [x] Slogan
  - [x] TOC
- [ ] Non-urgent fixes / improvements
  - [ ] Compare metadata on file update
  - [x] Prune/cleanup step
  - [ ] Dependency type (file, settings, folder)
- [ ] New systems
  - [ ] Tags
  - [ ] External links
  - [ ] Syntax highlighting
  - [ ] Social links

### High priority

- [x] Global nav
- [x] Breadcrumbs
- [x] Page classes
- [ ] GetMany "path exists" filter
- [ ] GetMany "extension" filter
- [ ] Delete settings logic
- [ ] Update settings logic
- [ ] Logical operators for filters
- [ ] Customize menus
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
    - [x] Bundling
  - [ ] PDFs
  - [ ] Videos
  - [ ] Arbitrary data
- [x] Add homepage to global nav
- [x] Page lists
- [x] Dates
- [x] robots.txt
- [x] sitemap.xml
- [ ] 404.html
- [ ] Better URL normalization (see notes)
- [x] Name casing
- [x] TUI
  - [x] Create settings.md
    - [x] Site title
    - [x] Domain
    - [ ] Webmentions
    - [x] Logo
    - [x] Wordmark
    - [ ] Identity (rel=me)
    - [x] Filename breadcrumbs
    - [x] RSS
    - [x] Sitemap
  - [x] Create home.md
  - [ ] Create folder settings files
    - [ ] Title
    - [ ] Breadcrumb
- [ ] Remove index file rules
- [x] Custom CSS
  - [x] styles.css
  - [ ] Any CSS file
- [ ] Tags
- [ ] Date format settings
- [ ] ::mark::
- [x] Infer images
- [ ] Favicon
- [-] Webmentions
- [x] HTML boilerplate
- [ ] View transitions
- [x] Logo
- [x] Wordmark
- [ ] Sort nav items
- [ ] Canonical URL
- [ ] Handle external links
- [x] Admonitions
- [ ] Use hgroup for site title, page title, etc
- [ ] Images as `<figure>`
- [ ] Hidden routes
- [ ] Frontmatter settings
  - [ ] HTML
  - [ ] RSS
  - [ ] Sitemap
- [x] Heading anchors
- [ ] Taxonomy pages and smart frontmatter
- [x] CSS cache busting
- [x] Slogan in homepage title
- [ ] GFM emojis (:smile:)

### Medium priority

- [ ] Tests
- [ ] Internal backlinks
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
- [-] Post-publish work (ping webmentions)
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
- [ ] Verify all element types from Obsidian
- [ ] Order/position/kanban
- [ ] Next/prev links
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
