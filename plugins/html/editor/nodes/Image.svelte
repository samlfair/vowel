<script>
  import { getContext } from "svelte"
  import { Node, CustomProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
</script>

<!-- The served <picture> markup is kept verbatim so edit mode matches the
     page: the responsive derivatives cannot be rebuilt from source + alt. -->
<Node {path}>
  <CustomProperty path={[...path, "source"]}>
    <div contenteditable="false">{@html node.html}</div>
  </CustomProperty>
</Node>
