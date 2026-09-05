<script>
  import { setContext, onMount } from "svelte"
  import { Svedit, KeyMapper } from "svedit"
  import create_session from "./create-session.js"
  import serialize from "./serialize.js"
  import Toolbar from "./Toolbar.svelte"

  export let element

  let session = null
  let unrecognised = []
  let editable = false

  const key_mapper = new KeyMapper()
  setContext("key_mapper", key_mapper)

  onMount(() => {
    // Ingest reads the server-rendered DOM, so it has to run before
    // anything clears it.
    const result = create_session(element)
    unrecognised = result.unrecognised

    if (!result.session) {
      console.warn(
        "[vowel] editor stayed read-only: #content holds elements the ingest allowlist " +
        "does not recognise:", unrecognised
      )
      return
    }

    // Svedit renders the document itself rather than hydrating over the
    // server output, so the original children go before it mounts.
    element.replaceChildren()
    session = result.session
  })

  // Experimental: the markdown is logged, not written. Wiring this to
  // voot's write endpoint needs a body-only write mode first, or saving
  // would drop the file's front matter.
  function save() {
    const markdown = serialize(session.doc)
    console.info("[vowel] markdown for %s\n\n%s", window.location.pathname, markdown)
    return markdown
  }
</script>

<svelte:window onkeydown={key_mapper.handle_keydown.bind(key_mapper)} />

{#if session}
  <Svedit {session} bind:editable path={[session.doc.document_id]} />
  <Toolbar {session} {save} bind:editable />
{/if}
