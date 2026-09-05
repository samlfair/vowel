import { mount } from "svelte"
import Editor from "./Editor.svelte"
import openSocket from "./socket.js"

openSocket()

// section#content holds the rendered markdown body and nothing else - the
// header, nav, aside and footer around it are generated, so the editable
// region is exactly this element. The editor ingests its HTML as the
// document's source of truth (see ingest.js).
const content = document.getElementById("content")

if (content) {
  mount(Editor, { target: content, props: { element: content } })
}
