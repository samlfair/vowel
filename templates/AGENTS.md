# Notes for AI agents

This folder is a website built with [Vowel](https://vowel.cc). Every `.md` file is a page, each folder is a section, and `settings.md` holds the site's settings.

- **Check your work.** After every change, run `npx vowel@latest check`. It lists each problem as `file:line:column` and exits with 1 until there are none.
- **The preview** is `npx vowel@latest`, at `http://localhost:8000`. It never exits, so start it only in the background, or ask the owner to run it.
- **Ask before publishing.** `npx vowel@latest --command deploy` puts the site on the web.
- **Write markdown, not HTML.** Vowel drops HTML in pages, and its build output is outside this folder; don't edit it.
- **Secret pages aren't private.** A `##` in a name hides a page at a hashed URL, but anyone with these files can find it.

How Vowel works, in markdown:

- Files and pages: https://vowel.cc/docs/guides/files.md
- Markdown: https://vowel.cc/docs/guides/markdown.md
- Settings: https://vowel.cc/docs/guides/site.md
- The command line: https://vowel.cc/docs/references/vowel.md

## This site

<!-- Your own conventions, for any agent working here: where posts go, how you like headings, what to leave alone. -->
