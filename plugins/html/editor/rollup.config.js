import svelte from "rollup-plugin-svelte"
import resolve from "@rollup/plugin-node-resolve"
import css from "rollup-plugin-import-css"
import cleanup from "rollup-plugin-cleanup"

// Compiles the Svedit editor into a single inlineable bundle,
// committed at ../bundle/index.js -
// vowel/plugins/html/index.js reads that file's contents once at plugin
// load time and injects it into every previewed page's
// handlePreviewRequest, the same way it already inlines votive's
// openSocket() reload client. Rebuild with `npm run build:editor` from
// vowel's root after editing anything in this folder.
export default {
  input: "main.js",
  output: {
    file: "../bundle/index.js",
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
      // The default extensions must be listed alongside .svelte: passing
      // only .svelte overrides them, and bare package imports (e.g.
      // mdast-util-to-markdown) then silently resolve to nothing.
      extensions: [".svelte", ".mjs", ".js", ".json", ".node"]
    }),
    css(),
    cleanup()
  ]
}
