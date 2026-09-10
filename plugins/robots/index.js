/** @import * as Votive from "votive" */



/** @type {Votive.VotiveProcessor} */
const processor = {
  extensions: [".txt"],
  format: "text",
  writeFile: (target) => ({ data: target.data }),
  router: ({ name, dir, ext }) => ({ name, dir, ext })
}

/** @type {Votive.VotivePlugin} */
const plugin = {
  name: "vowel-robots",
  processors: [processor]
}

export default plugin
