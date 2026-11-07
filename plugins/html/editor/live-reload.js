import openSocket from "./socket.js"

// The live-reload client alone, for every previewed page. The editor's
// bundle (main.js, which opens the same socket) replaces it only when
// the dev server was started with `vowel --editor`: without the flag a
// page carried Svelte, Svedit and the editor, 730 KB inline, to run
// this one call.
openSocket()
