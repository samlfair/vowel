/** @import * as Votive from "votive" */

/** @type {Votive.VotiveProcessor} */
const iconReader = {
  router: ({ name, dir, ext }) => ({ name, dir, ext }),
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
  processors: [iconReader]
}

export default vowelIconsPlugin
