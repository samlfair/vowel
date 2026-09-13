import generateRobots from "./robots.js"

/** @import * as Votive from "votive" */

/**
 * `robots.txt` is a stub: vowel declares it unconditionally and an author
 * who writes their own `robots.txt` shadows it, which is the whole of the
 * override rule. It used to be created from the markdown plugin's
 * readFolder, which is why generateRobots lived over there.
 *
 * No params: the content is a constant, so it is expanded once and never
 * re-expanded on a warm database. See
 * tasks/1-proposed/post-stubs-vowel-followups.md section 3 for the
 * version-stamp question that raises, which is parked.
 *
 * @type {Votive.VotiveProcessor}
 */
const processor = {
  extensions: [".txt"],
  format: "text",
  stubs: () => [{ path: "robots.txt" }],
  expand: () => ({ text: generateRobots() }),
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
