import svelte from "rollup-plugin-svelte"
import resolve from "@rollup/plugin-node-resolve"

// Compiles the dev-preview "save a timestamped file" widget into a
// single inlineable bundle, committed at ../editorClient.js -
// vowel/plugins/html/index.js reads that file's contents once at plugin
// load time and injects it into every previewed page's
// handlePreviewRequest, the same way it already inlines voot's
// openSocket() reload client. Rebuild with `npm run build:editor` from
// vowel's root after editing anything in this folder.
export default {
  input: "main.js",
  output: {
    file: "../editorClient.js",
    format: "iife"
  },
  plugins: [
    // emitCss: false - inline styles into the JS output instead of
    // emitting a separate CSS asset, since this bundle gets injected as
    // one self-contained inline <script>, not linked as a file.
    svelte({ emitCss: false }),
    resolve({
      browser: true,
      exportConditions: ["svelte"],
      extensions: [".svelte"]
    })
  ]
}
