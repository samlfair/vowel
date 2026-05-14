/** @import * as Votive from "votive" */

/** @type {Votive.VotiveProcessor} */
const iconReader = {
  syntax: "icon",
  filter: {
    extensions: [".ico"]
  },
  read: {
    path: null,
  },
  write: null
}

/** @type {Votive.VotivePlugin} */
const vowelIconsPlugin = {
  name: "vowel-icons",
  processors: [iconReader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelIconsPlugin
