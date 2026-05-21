/** @import * as Votive from "votive" */



/** @type {Votive.VotiveProcessor} */
const processor = {
  extensions: [".txt"],
  format: "text",
  writeFile: (target) => ({ data: target.abstract.content })
}

/** @type {Votive.VotivePlugin} */
const plugin = {
  name: "vowel-robots",
  processors: [processor],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default plugin
