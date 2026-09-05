<script>
  import { Node, TextProperty } from "svedit"

  let { path } = $props()
</script>

<Node {path}>
  <TextProperty tag="li" path={[...path, "content"]} placeholder="List item" />
</Node>
