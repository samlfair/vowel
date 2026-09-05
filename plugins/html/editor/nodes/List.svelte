<script>
  import { getContext } from "svelte"
  import { Node, NodeArrayProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
  const tag = $derived(node.ordered ? "ol" : "ul")
</script>

<Node {path}>
  <NodeArrayProperty {tag} path={[...path, "items"]} />
</Node>
