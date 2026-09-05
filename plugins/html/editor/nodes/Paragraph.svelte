<script>
  import { Node, TextProperty } from "svedit"

  let { path } = $props()
</script>

<Node {path}>
  <TextProperty tag="p" path={[...path, "content"]} placeholder="Paragraph" />
</Node>
