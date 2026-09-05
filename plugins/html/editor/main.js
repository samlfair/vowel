import { mount } from "svelte"
import Editor from "./Editor.svelte"
import openSocket from "./socket.js"

openSocket()

// A container of its own, not document.body directly - the page being
// previewed owns its own body content, this widget just floats above it
// (see SaveButton.svelte's position: fixed).

const content = document.getElementById("content")

console.log({ content })

const mounted = mount(Editor, { target: content, props: { element: content }})