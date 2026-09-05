<script>
  import { Node, NodeArrayProperty } from "svedit"

  let { path } = $props()
</script>

<Node {path}>
  <NodeArrayProperty tag="blockquote" path={[...path, "body"]} />
</Node>
