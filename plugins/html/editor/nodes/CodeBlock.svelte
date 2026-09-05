<script>
  import { getContext } from "svelte"
  import { Node, CustomProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
</script>

<!-- Read-only for now: the code is a string property, not a text
     property, so it has no inline editing surface yet. -->
<Node {path}>
  <CustomProperty tag="pre" path={[...path, "code"]}>
    <code contenteditable="false" class={node.language ? `language-${node.language}` : ""}
      >{node.code}</code>
  </CustomProperty>
</Node>
