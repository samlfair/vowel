<script>
  import { getContext } from "svelte"

  const svedit = getContext("svedit")

  let { path, content } = $props()

  const node = $derived(svedit.session.get(path))
</script>

<code id={node.id} data-node-id={node.id}>{content}</code>
