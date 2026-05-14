/** @import * as Votive from "votive" */

/** @type {Votive.VotiveProcessor} */
const fontsReader = {
  syntax: "font",
  filter: {
    extensions: [".woff", ".woff2", ".ttf", ".otf"]
  },
  read: {
    path: null,
  },
  write: null
}

/** @type {Votive.VotivePlugin} */
const vowelFontsPlugin = {
  name: "vowel-fonts",
  processors: [fontsReader],
  router: ({ name, dir, ext }) => {
    return {
      name, dir, ext
    }
  }
}

export default vowelFontsPlugin
