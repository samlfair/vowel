<script>
  import { Node } from "svedit"

  let { path } = $props()
</script>

<Node {path}>
  <hr contenteditable="false" />
</Node>
