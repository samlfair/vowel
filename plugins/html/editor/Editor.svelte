<script>
  import { setContext } from "svelte"
  import { Svedit, KeyMapper } from "svedit"
  import serialize from "./serialize.js"
  import Toolbar from "./Toolbar.svelte"
  import { splitFrontmatter, writeSettings as writeFile } from "./settings-file.js"

  // Both props are read off the rendered page before this mounts, by
  // main.js's startEditing: the session from section#content, the title
  // and frontmatter from the <main> around it. Ingesting has to happen
  // while the server output is still there, and section#content has to be
  // emptied before this component is mounted into it - which is why
  // neither belongs here.
  //
  // The frontmatter round trips unchanged for now; carrying it is what
  // lets a save reproduce the whole file rather than just the body.
  let { session, frontmatter } = $props()

  // The button that mounted this said Edit, so editing is already on and
  // the toolbar's own toggle reads Save.
  let editable = $state(true)

  const key_mapper = new KeyMapper()
  setContext("key_mapper", key_mapper)

  // Frontmatter from the source, body from the editor. The source is
  // fetched at save time (GET <page>?source, votive's read half of the
  // write endpoint) rather than when the editor opened, so a hand edit
  // made meanwhile is less likely to be clobbered. Taking the
  // frontmatter from the source rather than the rendered page is what
  // lets a hidden key (secret_key) survive a save without ever being on
  // the page. The title is the one key that isn't kept: it is written
  // back as a `#` heading, never as `title:`, so a file whose title
  // lived only in frontmatter gains a heading and loses the key.
  async function save() {
    const response = await fetch(`${window.location.pathname}?source`, { cache: "no-store" })
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}))
      console.error("[vowel] not saved:", detail.error || `no source for ${window.location.pathname} (${response.status})`)
      return
    }
    const { path, text } = await response.json()
    const { title: ignoredTitle, ...properties } = splitFrontmatter(text).data
    const markdown = serialize(session.doc, { title: frontmatter.title, properties })
    await writeFile(path, markdown)
    console.info("[vowel] saved %s", path)
  }
</script>

<svelte:window onkeydown={key_mapper.handle_keydown.bind(key_mapper)} />

<Svedit {session} bind:editable path={[session.doc.document_id]} />
<Toolbar {session} {save} bind:editable />
