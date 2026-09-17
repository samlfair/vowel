import { groups, defaults } from "./agents.js"

/**
 * The robots.txt text for a `robots` setting. Group keys expand to every
 * agent in the group; any other key is an agent name and overrides its
 * group. `true` is `Allow: /`, `false` is `Disallow: /`, anything else
 * is ignored. Agents nobody mentioned get no block, which robots.txt
 * reads as allowed.
 *
 * Order in the file: `*` last, because a crawler takes the most specific
 * matching group and a reader scanning the file expects the catch-all
 * at the bottom.
 * @param {Record<string, unknown>} [config] - the `robots` setting
 * @param {string} [domain] - emits the Sitemap line when set
 */
function generateRobots(config = {}, domain) {
  // Only booleans are opinions; anything else leaves the default in place.
  const declared = Object.entries(config).filter(([, value]) => typeof value === "boolean")
  const settings = { ...defaults, ...Object.fromEntries(declared) }
  const groupNames = Object.keys(groups)
  const lower = (name) => String(name).toLowerCase()

  // Group rules first, then per-agent overrides on top. The map is keyed
  // by lowercase name so `gptbot: true` overrides `GPTBot` in the ai
  // group; the group's own spelling is what gets written.
  const spelling = new Map(Object.values(groups).flat().map(agent => [lower(agent), agent]))
  const rules = new Map()

  for (const [key, value] of Object.entries(settings)) {
    if (!groupNames.includes(lower(key))) continue
    for (const agent of groups[lower(key)]) rules.set(lower(agent), value)
  }
  for (const [key, value] of Object.entries(settings)) {
    if (groupNames.includes(lower(key))) continue
    rules.set(lower(key), value)
    if (!spelling.has(lower(key))) spelling.set(lower(key), key)
  }

  const blocks = [...rules.entries()]
    .sort(([a], [b]) => (a === "*") - (b === "*"))
    .map(([agent, allowed]) => `User-agent: ${spelling.get(agent)}\n${allowed ? "Allow" : "Disallow"}: /`)

  const sitemap = domain ? [`Sitemap: https://${domain}/sitemap.xml`] : []

  return [...blocks, ...sitemap].join("\n\n")
}

export default generateRobots
