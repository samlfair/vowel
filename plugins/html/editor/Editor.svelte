<script>
  import { setContext, onMount } from "svelte";
  import { Svedit, KeyMapper } from "svedit";
  import create_session from "./create-session.js";
  import Toolbar from "./Toolbar.svelte";

  export let element;

  let session;
  let editable = true;

  const key_mapper = new KeyMapper();
  setContext("key_mapper", key_mapper);

  onMount(() => {
    session = create_session(element);
  });
</script>

<svelte:window onkeydown={key_mapper.handle_keydown.bind(key_mapper)} />

{#if session}
  <Svedit {session} bind:editable path={[session.doc.document_id]} />
  <Toolbar {session} bind:editable />
{/if}
