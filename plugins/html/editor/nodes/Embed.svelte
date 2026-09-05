<script>
  import { getContext } from "svelte"
  import { Node, CustomProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
</script>

<!-- An expansion of a compact directive. Its children were generated from
     other targets, so it is selectable and deletable as a unit but never
     editable as prose - it collapses back to node.directive on save. -->
<Node {path}>
  <CustomProperty path={[...path, "directive"]}>
    <div contenteditable="false" class="embed" title={node.directive}>{@html node.html}</div>
  </CustomProperty>
</Node>
