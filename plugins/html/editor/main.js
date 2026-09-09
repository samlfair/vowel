import { mount, unmount } from "svelte"
import Editor from "./Editor.svelte"
import EditButton from "./EditButton.svelte"
import SettingsPanel from "./SettingsPanel.svelte"
import createSession from "./create-session.js"
import readFrontmatter from "./frontmatter.js"
import openSocket from "./socket.js"

openSocket()

// section#content holds the rendered markdown body and nothing else - the
// header, nav, aside and footer around it are generated, so the editable
// region is exactly this element. The editor ingests its HTML as the
// document's source of truth (see ingest.js).
const content = document.getElementById("content")

const noFrontmatter = { title: null, properties: {} }

/**
 * Swaps the server-rendered body for the editor. A previewed page runs
 * none of this until the button is pressed, so what a reader loads is the
 * page plus one button.
 *
 * The order here is the contract. Ingest reads the rendered DOM, so it
 * runs before anything clears it; the clear runs before mount(), because
 * mount() appends its render anchor *into* the target. Clearing a mount
 * target after mounting detaches that anchor, and every later render then
 * lands in a detached fragment - which leaves section#content empty with
 * no error anywhere.
 *
 * @returns {string[]} the elements ingest did not recognise - empty when
 *   the editor started. A page holding one stays read-only rather than
 *   being guessed at, because a wrong guess round trips to markdown that
 *   silently replaces the author's content on save.
 */
function startEditing() {
  const { session, unrecognised } = createSession(content)

  if (!session) {
    console.warn(
      "[vowel] editor stayed read-only: #content holds elements the ingest allowlist " +
      "does not recognise:", unrecognised
    )
    return unrecognised
  }

  // The title and frontmatter live in <main>, alongside section#content
  // rather than inside it. They round trip unchanged for now - reading
  // them is what lets a save reproduce the whole file.
  const main = content.closest("main")
  const frontmatter = main ? readFrontmatter(main) : noFrontmatter

  // Svedit renders the document itself rather than hydrating over the
  // server output, so the original children go before it mounts.
  content.replaceChildren()
  mount(Editor, { target: content, props: { session, frontmatter } })

  return []
}

// The panel is mounted and unmounted rather than hidden: it reads
// settings.md when it appears, so reopening it picks up an edit made
// elsewhere in the meantime and there is nothing to invalidate.
const settings = { panel: null }

function closeSettings() {
  if (!settings.panel) return
  unmount(settings.panel)
  settings.panel = null
}

function toggleSettings() {
  if (settings.panel) return closeSettings()
  settings.panel = mount(SettingsPanel, {
    target: document.body,
    props: { onclose: closeSettings }
  })
}

if (content) {
  mount(EditButton, {
    target: document.body,
    props: { onedit: startEditing, onsettings: toggleSettings }
  })
}
