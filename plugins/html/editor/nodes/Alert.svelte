<script>
  import { getContext } from "svelte"
  import { Node, NodeArrayProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
  const variant = $derived(node.variant || "note")
  const label = $derived(variant.charAt(0).toUpperCase() + variant.slice(1))
</script>

<!-- Mirrors the html plugin's alert markup, including the heading it
     injects in place of the consumed [!NOTE] marker. -->
<Node {path}>
  <aside class="alert {variant}">
    <h2 contenteditable="false">{label}</h2>
    <NodeArrayProperty path={[...path, "body"]} />
  </aside>
</Node>
