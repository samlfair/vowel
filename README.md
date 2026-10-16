# Vowel

*Markdown websites in milliseconds*

Vowel turns a folder of markdown files into a website. Write pages as
plain `.md` files, in Obsidian or any editor; Vowel works out titles,
dates, breadcrumbs, menus, tags, a feed and a sitemap from the files
and how they're arranged, so there's almost nothing to configure.

**Documentation: [vowel.cc](https://vowel.cc)**

## Start

Vowel needs [Node.js](https://nodejs.org) 26 or later. In the folder
that holds your markdown:

```bash
npx vowel@latest
```

The first time, a short setup offers to write a `settings.md` and a
`home.md`. Vowel then builds the site and serves a preview at
`http://localhost:8000`, updating it as you edit.

## Publish

```bash
vowel export ../my-site          # build into a folder, to upload anywhere
vowel --command deploy           # build and deploy to Cloudflare Pages
```

See [the docs](https://vowel.cc) for deploying, AT Protocol publishing,
themes, and every setting.

## How it's built

Vowel is a set of plugins for [Votive](https://github.com/samlfair/votive),
a file processor that turns sources into targets and rebuilds only what
an edit changed.

## Contributing

Run the tests with `node --test tests/*.js`. Plans and open questions
are in [ROADMAP.md](./ROADMAP.md).

## License

[MIT](./LICENSE)
