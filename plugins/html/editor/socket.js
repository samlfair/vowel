/**
 * Live reload without the reload. Every "a target changed" message is
 * the target itself (see TargetOutput in votive/lib/createDatabase.js),
 * with `data` holding the file as written. For the page being viewed
 * that is a whole HTML document, and this patches the live DOM to match
 * it rather than calling location.reload().
 *
 * It used to compare the pushed <head> with the live one and reload on
 * any difference. Three things made that a reload on nearly every edit:
 * <title>, og:title and og:description are derived from the content, so
 * editing the content changed the head; a settings row that flipped
 * every build changed it too (fixed at the source); and a stylesheet
 * cache-buster that hashed mutable data flipped every pass (also fixed).
 * None of those needed a reload - they needed the head patched, which
 * this does.
 *
 * The body is morphed, not replaced. `body.replaceWith(newBody)` also
 * threw away everything the client had put there: the injected editor
 * script, the Edit button, the settings panel, and the editor itself if
 * it was mounted - so a save from the settings panel destroyed the
 * panel, and one patch removed the Edit button. Only the elements the
 * build produced are touched; anything else in the body is left alone.
 * While the editor is mounted (`data-vowel-editing` on <html>), <main>
 * is left alone too: the editor's own content is the newer of the two.
 */
export default function openSocket() {
  console.info("Socket opened")
  const socket = new WebSocket(`ws://${window.location.host}`);
  socket.addEventListener('open', () => {
    socket.send('opened')
  });


  socket.addEventListener("close", () => {
    console.info("Socket closed")
    socket.close()
    setTimeout(() => {
      console.info("socket closed refresh")
      location.reload()

    }, 1000)
  })

  function isOpen() {
    return socket.readyState === 1
  }

  socket.addEventListener('message', e => {
    if (!isOpen()) return

    const target = JSON.parse(e.data)

    // Nothing here knows what a non-html target should do on change yet -
    // that's each content type's own concern to add, same as html's own
    // patch logic below isn't generic.
    if (target.extension !== ".html") return

    const regex = new RegExp(window.location.pathname + "(index)?(\\.html)")
    if (!("/" + target.path).match(regex)) return

    // No data at all (too large for the socket, or already gone) is the
    // one case a reload is still the honest answer.
    if (!target.data) {
      location.reload()
      return
    }

    const next = new DOMParser().parseFromString(target.data, "text/html")
    patchHead(document.head, next.head)
    patchBody(document.body, next.body)
  });
}

/**
 * Elements are matched by their serialized form: one that exists in
 * both heads is kept where it is (a <link> that is neither moved nor
 * re-created is never refetched, so the page doesn't flash), one only
 * in the new head is inserted before the next element that survives,
 * one only in the old head is removed. <title> is special-cased because
 * its text is what changes most.
 * @param {HTMLHeadElement} head
 * @param {HTMLHeadElement} nextHead
 */
function patchHead(head, nextHead) {
  const nextTitle = nextHead.querySelector("title")
  if (nextTitle && document.title !== nextTitle.textContent) document.title = nextTitle.textContent

  const isTitle = element => element.tagName === "TITLE"
  const remaining = new Map()
  for (const element of head.children) {
    if (isTitle(element)) continue
    const key = element.outerHTML
    if (!remaining.has(key)) remaining.set(key, [])
    remaining.get(key).push(element)
  }

  const keep = new Set()
  const pending = []
  const place = (clone, before) => {
    before ? head.insertBefore(clone, before) : head.appendChild(clone)
    keep.add(clone)
  }
  for (const element of nextHead.children) {
    if (isTitle(element)) continue
    const matches = remaining.get(element.outerHTML)
    const existing = matches && matches.shift()
    if (existing) {
      // Everything queued since the last survivor goes in front of it,
      // in order.
      pending.forEach(clone => place(clone, existing))
      pending.length = 0
      keep.add(existing)
      continue
    }
    pending.push(document.importNode(element, true))
  }
  pending.forEach(clone => place(clone, null))

  for (const element of [...head.children]) {
    if (isTitle(element) || keep.has(element)) continue
    element.remove()
  }
}

/**
 * The build's top-level body elements are matched by tag and id (a
 * page has one <header>, one <main>, one <aside>, one <footer>, and
 * the html plugin gives anything else an id). Each is replaced with its
 * new version, a new one is inserted where the build put it, an old one
 * the build no longer produces is removed. Nothing the client added is
 * touched.
 * @param {HTMLElement} body
 * @param {HTMLElement} nextBody
 */
function patchBody(body, nextBody) {
  const editing = document.documentElement.dataset.vowelEditing === "true"
  const keyOf = element => element.id ? `${element.tagName}#${element.id}` : element.tagName
  // Only the build's own elements take part, on both sides: a <script>
  // in the pushed file would not run if inserted, and never matches
  // the client's.
  const incoming = [...nextBody.children].filter(wasProduced)
  const produced = new Set(incoming.map(keyOf))

  const current = new Map()
  for (const element of body.children) {
    if (!wasProduced(element)) continue
    const key = keyOf(element)
    if (produced.has(key) && !current.has(key)) current.set(key, element)
  }

  // Walk the new body in order, keeping a cursor so an element the
  // build added lands in the right place relative to its siblings.
  const placed = new Set()
  let cursor = null
  for (const element of incoming) {
    const key = keyOf(element)
    const existing = current.get(key)
    if (existing && editing && existing.tagName === "MAIN") {
      placed.add(existing)
      cursor = existing
      continue
    }
    const fresh = document.importNode(element, true)
    if (existing) {
      existing.replaceWith(fresh)
    } else if (cursor) {
      cursor.after(fresh)
    } else {
      body.prepend(fresh)
    }
    placed.add(fresh)
    cursor = fresh
  }

  for (const [, element] of current) {
    if (!placed.has(element) && element.isConnected) element.remove()
  }

  for (const element of [...body.children]) {
    if (!produced.has(keyOf(element)) && wasProduced(element)) element.remove()
  }
}

/**
 * The client adds elements that aren't the build's: the editor's own
 * <script type="module">, and whatever Svelte mounts into the body (the
 * Edit button, the settings panel, overlays). A <script> or a Svelte
 * host is never the build's, so the morph never touches them - the
 * Svelte components that mount into the body mark their root with
 * data-vowel-client (the settings panel is an <aside>, like the page's
 * nav); the page-structure elements and anything with an id are.
 * @param {Element} element
 */
function wasProduced(element) {
  if (element.tagName === "SCRIPT") return false
  if (element.hasAttribute("data-vowel-client")) return false
  return ["HEADER", "MAIN", "ASIDE", "FOOTER", "NAV"].includes(element.tagName) || Boolean(element.id)
}
