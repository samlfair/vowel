<script>
  import { setContext } from "svelte"
  import { Svedit, KeyMapper } from "svedit"
  import serialize from "./serialize.js"
  import Toolbar from "./Toolbar.svelte"

  // Both props are read off the rendered page before this mounts, by
  // main.js's startEditing: the session from section#content, the title
  // and frontmatter from the <main> around it. Ingesting has to happen
  // while the server output is still there, and section#content has to be
  // emptied before this component is mounted into it - which is why
  // neither belongs here.
  //
  // The frontmatter round trips unchanged for now; carrying it is what
  // lets a save reproduce the whole file rather than just the body.
  let { session, frontmatter } = $props()

  // The button that mounted this said Edit, so editing is already on and
  // the toolbar's own toggle reads Save.
  let editable = $state(true)

  const key_mapper = new KeyMapper()
  setContext("key_mapper", key_mapper)

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

<Svedit {session} bind:editable path={[session.doc.document_id]} />
<Toolbar {session} {save} bind:editable />
