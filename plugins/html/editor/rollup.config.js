import svelte from "rollup-plugin-svelte"
import resolve from "@rollup/plugin-node-resolve"
import css from "rollup-plugin-import-css"
import cleanup from "rollup-plugin-cleanup"

// Two inlineable bundles, both committed in ../bundle/:
// live-reload.js, the live-reload client alone, which every previewed
// page gets, and index.js, the Svedit editor with the same client in
// it, which replaces it under `vowel --editor`.
// vowel/plugins/html/index.js reads them and injects one into each
// previewed page in handlePreviewRequest. Rebuild with
// `npm run build:editor` from vowel's root after editing anything in
// this folder.
const liveReload = {
  input: "live-reload.js",
  output: {
    file: "../bundle/live-reload.js",
    format: "iife"
  },
  plugins: [cleanup()]
}

const editor = {
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

export default [liveReload, editor]
