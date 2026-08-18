import { mount } from "svelte"
import SaveButton from "./SaveButton.svelte"

// A container of its own, not document.body directly - the page being
// previewed owns its own body content, this widget just floats above it
// (see SaveButton.svelte's position: fixed).
const container = document.createElement("div")
document.body.appendChild(container)

mount(SaveButton, { target: container })
