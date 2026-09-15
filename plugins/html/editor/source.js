/**
 * The page's source, as the preview handed it over: the source path and
 * markdown of this page, and of the root settings.md. Seeded from the
 * JSON the html plugin injects (#vowel-source) and kept current from the
 * live-reload socket, which pushes the whole target - metadata included
 * - on every rebuild. The editor and the settings panel read it at save
 * time, so the frontmatter they keep is the newest the build has seen.
 *
 * It used to be fetched: GET <page>?source for the page, and settings.md
 * was emitted as a target so the panel could GET it. Neither exists now.
 */

const empty = { path: null, markdown: null, settings: { path: "settings.md", markdown: null } }

let current = null

function seed() {
  if (current) return current
  const element = document.getElementById("vowel-source")
  try {
    current = element ? { ...empty, ...JSON.parse(element.textContent) } : { ...empty }
  } catch {
    current = { ...empty }
  }
  return current
}

/** The page's source path and markdown, and the root settings.md's. */
export function getSource() {
  return seed()
}

/** A rebuilt target arrived over the socket: take its source and markdown. */
export function updateFromTarget(target) {
  const source = seed()
  if (typeof target.source === "string") source.path = target.source
  if (typeof target.metadata?.markdown === "string") source.markdown = target.metadata.markdown
}

/** The settings panel wrote settings.md: remember what it wrote. */
export function updateSettings(markdown) {
  seed().settings.markdown = markdown
}
