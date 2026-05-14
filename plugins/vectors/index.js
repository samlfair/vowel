/** @import * as Votive from "votive" */

/** @type {Votive.VotiveProcessor} */
const vectorReader = {
  syntax: "vector",
  filter: {
    extensions: [".svg"]
  },
  read: {
    path: null,
  },
  write: null
}

/** @type {Votive.VotivePlugin} */
const vowelVectorsPlugin = {
  name: "vowel-vectors",
  processors: [vectorReader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelVectorsPlugin
