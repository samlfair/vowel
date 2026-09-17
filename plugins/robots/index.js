import generateRobots from "./robots.js"

/** @import * as Votive from "votive" */

/**
 * `robots.txt` is a stub: vowel declares it unconditionally and an author
 * who writes their own `robots.txt` shadows it, which is the whole of the
 * override rule. It used to be created from the markdown plugin's
 * readFolder, which is why generateRobots lived over there.
 *
 * Configured from the root settings.md's `robots` setting (see
 * agents.js for the groups), and it names the sitemap when `domain` is
 * set. Both ride in the stub's params, so a change to either re-expands
 * the file and nothing else does. The default list still has no
 * version stamp: see tasks/1-proposed/wipe-cache-on-upgrade.md.
 *
 * @type {Votive.VotiveProcessor}
 */
const processor = {
  extensions: [".txt"],
  format: "text",
  createStubs: ({ settings }) => [{
    path: "robots.txt",
    params: {
      robots: settings.lastNonNull("fm_robots") ?? null,
      domain: settings.lastNonNull("fm_domain") ?? null
    }
  }],
  expandStubs: ({ params }) => ({ text: generateRobots(params.robots ?? {}, params.domain ?? undefined) }),
  // A .txt source carries no metadata worth inferring; its text is the
  // target's content and the write pass hands it straight back.
  readFile: (source) => ({ data: source.text, metadata: {} }),
  writeFile: (target) => ({ data: target.data }),
  router: ({ name, dir, ext }) => ({ name, dir, ext })
}

/** @type {Votive.VotivePlugin} */
const plugin = {
  name: "vowel-robots",
  processors: [processor]
}

export default plugin
