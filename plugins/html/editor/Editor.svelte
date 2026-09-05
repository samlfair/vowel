<script>
  import { setContext, onMount } from "svelte"
  import { Svedit, KeyMapper } from "svedit"
  import create_session from "./create-session.js"
  import serialize from "./serialize.js"
  import readFrontmatter from "./frontmatter.js"
  import Toolbar from "./Toolbar.svelte"

  export let element

  let session = null
  let unrecognised = []
  let editable = false

  // The title and frontmatter live in <main>, alongside section#content
  // rather than inside it. They round trip unchanged for now - reading
  // them is what lets a save reproduce the whole file.
  let frontmatter = { title: null, properties: {} }

  const key_mapper = new KeyMapper()
  setContext("key_mapper", key_mapper)

  onMount(() => {
    // Ingest reads the server-rendered DOM, so it has to run before
    // anything clears it.
    const main = element.closest("main")
    if (main) frontmatter = readFrontmatter(main)

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

  // Experimental: the markdown is logged, not written. The whole file is
  // reproduced - frontmatter, title and body - so wiring this to voot's
  // write endpoint is now a matter of posting it rather than of teaching
  // the server to preserve anything.
  function save() {
    const markdown = serialize(session.doc, frontmatter)
    console.info("[vowel] markdown for %s\n\n%s", window.location.pathname, markdown)
    return markdown
  }
</script>

<svelte:window onkeydown={key_mapper.handle_keydown.bind(key_mapper)} />

{#if session}
  <Svedit {session} bind:editable path={[session.doc.document_id]} />
  <Toolbar {session} {save} bind:editable />
{/if}
