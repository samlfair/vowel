<script>
  import { getContext } from "svelte"
  import { Node, TextProperty } from "svedit"

  const svedit = getContext("svedit")

  let { path } = $props()

  const node = $derived(svedit.session.get(path))
  const tag = $derived(`h${node.level || 2}`)
</script>

<Node {path}>
  <TextProperty {tag} path={[...path, "content"]} placeholder="Heading" />
</Node>
