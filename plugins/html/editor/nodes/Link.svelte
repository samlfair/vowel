<script>
  import { getContext } from "svelte"

  const svedit = getContext("svedit")

  let { path, content } = $props()

  const node = $derived(svedit.session.get(path))
</script>

<!-- A div while editing: an <a> inside contenteditable causes unexpected
     selection behaviour (see svedit's README). -->
{#if svedit.editable}
  <div class="link" data-node-id={node.id} data-href={node.href}>{content}</div>
{:else}
  <a id={node.id} data-node-id={node.id} href={node.href}>{content}</a>
{/if}
