import { splitRef } from "./lexicons.js"
import { facetsFor } from "./body.js"

/**
 * A page as a record of a lexicon vowel has never seen: the schema is
 * fetched (lexicons.js), and every value is found, converted and checked
 * against it here. Nothing in this file names a lexicon, except the
 * standard.site rule below.
 *
 * **Where a value comes from**, for each property of the record:
 *
 * 1. The page's frontmatter, by name: `startsAt` or `starts_at` - the
 *    camelCase key wins when both are written. Nested YAML is a nested
 *    object, found the same way. Keys vowel reads for itself (`status`,
 *    `tags`, `atproto_lexicon`, … - frontmatter.js's EXPECTED) are never
 *    mapped by name.
 * 2. An alias, on the record's own properties only:
 *    - `title` and `name` ← the page's title
 *    - `description` ← its description, and nothing else ever is
 *    - `tags` ← its tags, frontmatter and hashtags
 *    - `image` ← its `image`, and only a property named `image`
 *    - `publishedAt` ← its date; else `createdAt` ← its date
 *    - the body ← the first of `content` and `text` the record has
 * 3. For a `site.standard.*` record, `site` and `path` as standard.site
 *    defines them: the publication's AT-URI and the page's path.
 *
 * **What happens to it**: it is converted to the property's type (a
 * date to a datetime, a root-relative path to a URL against `domain`),
 * trimmed at a word boundary when text is too long, cut when a list is,
 * and checked. A required property with no value, or one that fails,
 * means the page is not published, with a warning naming the lexicon
 * and the property. An optional one that fails is left out, with a
 * warning.
 */

const ALIAS_KEYS = new Set(["title", "name", "description", "tags", "image", "publishedAt", "createdAt"])
const BODY_KEYS = ["content", "text"]
const MARKDOWN_SLOTS = ["markdown", "content", "text"]

/**
 * @typedef {Map<string, { defs: Record<string, any> } | null>} Lexicons
 * @typedef {{
 *   title?: string, description?: string, date?: string, image?: string, tags?: string[],
 *   frontmatter: Record<string, unknown>,
 *   markdown: () => string,
 *   richText: (features: import("./body.js").Features) => { text: string, spans: any[] }
 * }} Page
 * @typedef {{ origin: string, pageURL: string, path: string, publication?: string, contentLexicon: string }} Context
 */

/** `startsAt` → `starts_at`. @param {string} name */
const snake = (name) => name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)

/** @param {unknown} value */
const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value)

/**
 * A property's value in a frontmatter object: its own name, else its
 * snake_case spelling.
 * @param {Record<string, unknown>} source
 * @param {string} name
 */
function byName(source, name) {
  if (name in source) return source[name]
  const spelled = snake(name)
  return spelled !== name && spelled in source ? source[spelled] : undefined
}

/**
 * A def by ref, a record def standing for its record object.
 * @param {Lexicons} lexicons
 * @param {string} ref
 * @param {string} from
 */
function resolveDef(lexicons, ref, from) {
  const [nsid, name] = splitRef(ref, from)
  const def = lexicons.get(nsid)?.defs?.[name]
  if (!def) return undefined
  return { nsid, name, id: name === "main" ? nsid : `${nsid}#${name}`, def: def.type === "record" ? def.record : def }
}

/** @param {string} ref @param {string} from */
function fullRef(ref, from) {
  const [nsid, name] = splitRef(ref, from)
  return name === "main" ? nsid : `${nsid}#${name}`
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

/**
 * The longest start of `text` within both limits, cut back to a word
 * boundary; one word longer than the limit is cut at a grapheme.
 * @param {string} text
 * @param {number} [maxGraphemes]
 * @param {number} [maxBytes]
 */
function trimWords(text, maxGraphemes = Infinity, maxBytes = Infinity) {
  const graphemes = [...segmenter.segment(text)].map(segment => segment.segment)
  if (graphemes.length <= maxGraphemes && Buffer.byteLength(text) <= maxBytes) return text
  const { fits } = graphemes.reduce(({ fits, bytes, done }, grapheme, index) => {
    if (done) return { fits, bytes, done }
    const next = bytes + Buffer.byteLength(grapheme)
    if (index + 1 > maxGraphemes || next > maxBytes) return { fits, bytes, done: true }
    return { fits: fits + grapheme, bytes: next, done: false }
  }, { fits: "", bytes: 0, done: false })
  const boundary = fits.search(/\s+\S*$/)
  const cut = boundary > 0 ? fits.slice(0, boundary) : fits
  return cut.replace(/\s+$/, "")
}

const FORMATS = {
  datetime: (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value),
  uri: (value) => /^[a-z][a-z0-9+.-]*:\S+$/i.test(value),
  "at-uri": (value) => /^at:\/\/\S+$/.test(value),
  did: (value) => /^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(value),
  handle: (value) => /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(value),
  "at-identifier": (value) => FORMATS.did(value) || FORMATS.handle(value),
  language: (value) => /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i.test(value),
  nsid: (value) => /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+\.[a-z][a-z0-9]*$/i.test(value)
}

/**
 * A value converted to a string property's format: a Date or a date
 * string to a datetime, a root-relative path to a URL.
 * @param {string} value
 * @param {string | undefined} format
 * @param {Context} context
 */
function toFormat(value, format, context) {
  // A time without seconds is the author's time, offset and all: add the
  // seconds atproto requires rather than moving it to UTC.
  const minutes = format === "datetime" ? value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})$/) : null
  if (minutes) return `${minutes[1]}:00${minutes[2]}`
  if (format === "datetime" && !FORMATS.datetime(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toISOString()
  }
  if (format === "uri" && value.startsWith("/")) return new URL(value, context.pageURL).href
  return value
}

/**
 * @typedef {{ ok: true, value: unknown, warnings?: string[] } | { ok: false, reason: string }} Fit
 */

/**
 * A value fitted to a schema node: converted, trimmed and checked.
 * @param {unknown} value
 * @param {any} schema
 * @param {string} from - the NSID local refs resolve in
 * @param {{ lexicons: Lexicons, context: Context }} env
 * @returns {Fit}
 */
function fit(value, schema, from, env) {
  const type = schema?.type
  if (value === undefined || value === null) return { ok: false, reason: "has no value" }

  if (type === "string") {
    const text = value instanceof Date ? value.toISOString() : typeof value === "number" || typeof value === "boolean" ? String(value) : value
    if (typeof text !== "string") return { ok: false, reason: `needs text, got ${Array.isArray(value) ? "a list" : typeof value}` }
    const formatted = toFormat(text, schema.format, env.context)
    if (schema.format && FORMATS[schema.format] && !FORMATS[schema.format](formatted)) return { ok: false, reason: `needs a ${schema.format}, got ${JSON.stringify(text)}` }
    const trimmed = schema.format ? formatted : trimWords(formatted, schema.maxGraphemes, schema.maxLength)
    if (schema.enum && !schema.enum.includes(trimmed)) return { ok: false, reason: `must be one of ${schema.enum.join(", ")}` }
    if (schema.const !== undefined && trimmed !== schema.const) return { ok: false, reason: `must be ${schema.const}` }
    const graphemes = [...segmenter.segment(trimmed)].length
    if ((schema.minGraphemes && graphemes < schema.minGraphemes) || (schema.minLength && Buffer.byteLength(trimmed) < schema.minLength)) return { ok: false, reason: "is too short" }
    return { ok: true, value: trimmed }
  }

  if (type === "integer") {
    const number = typeof value === "string" && value.trim() ? Number(value) : value
    if (typeof number !== "number" || !Number.isInteger(number)) return { ok: false, reason: `needs a whole number, got ${JSON.stringify(value)}` }
    if ((schema.minimum !== undefined && number < schema.minimum) || (schema.maximum !== undefined && number > schema.maximum)) return { ok: false, reason: `must be between ${schema.minimum ?? "-∞"} and ${schema.maximum ?? "∞"}` }
    if (schema.enum && !schema.enum.includes(number)) return { ok: false, reason: `must be one of ${schema.enum.join(", ")}` }
    return { ok: true, value: number }
  }

  if (type === "boolean") {
    if (typeof value !== "boolean") return { ok: false, reason: `needs true or false, got ${JSON.stringify(value)}` }
    return { ok: true, value }
  }

  if (type === "array") {
    const items = Array.isArray(value) ? value : [value]
    const fitted = items.map(item => fit(item, schema.items, from, env))
    const kept = fitted.filter(result => result.ok).map(result => result.value)
    const dropped = fitted.filter(result => !result.ok).map(result => `an item ${result.reason}`)
    const cut = schema.maxLength !== undefined ? kept.slice(0, schema.maxLength) : kept
    if (schema.minLength !== undefined && cut.length < schema.minLength) return { ok: false, reason: `needs at least ${schema.minLength} items` }
    return { ok: true, value: cut, warnings: dropped }
  }

  if (type === "object") return fitObject(value, schema, from, env)

  if (type === "ref") {
    const target = resolveDef(env.lexicons, schema.ref, from)
    // A lexicon that didn't resolve can't be checked: the author's value
    // goes as written.
    if (!target) return { ok: true, value }
    if (target.def.type === "token") return value === target.id ? { ok: true, value } : { ok: false, reason: `must be ${target.id}` }
    return fit(value, target.def, target.nsid, env)
  }

  if (type === "union") {
    if (!isPlainObject(value)) return { ok: false, reason: "needs an object with a $type" }
    const refs = (schema.refs ?? []).map(ref => fullRef(ref, from))
    const declared = typeof value.$type === "string" ? value.$type.replace(/#main$/, "") : refs.length === 1 ? refs[0] : undefined
    if (!declared) return { ok: false, reason: `needs a $type (one of ${refs.join(", ")})` }
    if (!refs.includes(declared)) {
      if (schema.closed) return { ok: false, reason: `$type must be one of ${refs.join(", ")}` }
      return { ok: true, value: { ...value, $type: declared } }
    }
    const target = resolveDef(env.lexicons, declared, from)
    if (!target) return { ok: true, value: { ...value, $type: declared } }
    const inner = fit(value, target.def, target.nsid, env)
    return inner.ok ? { ...inner, value: { $type: declared, ...inner.value } } : inner
  }

  if (type === "blob") {
    if (isPlainObject(value) && value.$type === "blob") return { ok: true, value }
    return { ok: false, reason: "is a file upload, which vowel doesn't do yet" }
  }

  if (type === "cid-link") return isPlainObject(value) && "$link" in value ? { ok: true, value } : { ok: false, reason: "needs a CID link" }
  if (type === "bytes") return isPlainObject(value) && "$bytes" in value ? { ok: true, value } : { ok: false, reason: "needs bytes" }
  return { ok: true, value }
}

/**
 * An object: each declared property found by name, fitted, and the
 * required ones insisted on. Undeclared keys are left out.
 * @param {unknown} value
 * @param {any} schema
 * @param {string} from
 * @param {{ lexicons: Lexicons, context: Context }} env
 * @returns {Fit}
 */
function fitObject(value, schema, from, env) {
  if (!isPlainObject(value)) return { ok: false, reason: `needs an object, got ${JSON.stringify(value)}` }
  const required = new Set(schema.required ?? [])
  const results = Object.entries(schema.properties ?? {}).map(([name, property]) => {
    const found = byName(value, name)
    if (found === undefined || found === null) return { name, missing: true }
    return { name, result: fit(found, property, from, env) }
  })
  const missing = results.find(entry => entry.missing && required.has(entry.name))
  if (missing) return { ok: false, reason: `needs ${missing.name}` }
  const failed = results.find(entry => entry.result && !entry.result.ok && required.has(entry.name))
  if (failed) return { ok: false, reason: `${failed.name} ${failed.result.reason}` }
  const kept = results.filter(entry => entry.result?.ok)
  const warnings = [
    ...results.filter(entry => entry.result && !entry.result.ok).map(entry => `${entry.name} ${entry.result.reason}; left out`),
    ...kept.flatMap(entry => (entry.result.warnings ?? []).map(warning => `${entry.name}: ${warning}`))
  ]
  return { ok: true, value: Object.fromEntries(kept.map(entry => [entry.name, entry.result.value])), warnings }
}

/**
 * The facet features a `facets` property allows, by name. The facet
 * def's `index` names its byte-slice properties.
 * @param {any} facetsSchema - the record's `facets` property
 * @param {string} from
 * @param {Lexicons} lexicons
 */
function facetShape(facetsSchema, from, lexicons) {
  const facet = facetsSchema?.items?.type === "ref" ? resolveDef(lexicons, facetsSchema.items.ref, from) : undefined
  if (facet?.def?.type !== "object") return undefined
  const index = facet.def.properties?.index?.type === "ref" ? resolveDef(lexicons, facet.def.properties.index.ref, facet.nsid) : undefined
  const indexProperties = Object.keys(index?.def?.properties ?? {})
  const startProperty = indexProperties.find(name => /start/i.test(name))
  const endProperty = indexProperties.find(name => /end/i.test(name))
  const union = facet.def.properties?.features?.items
  if (!startProperty || !endProperty || union?.type !== "union") return undefined

  const features = Object.fromEntries((union.refs ?? []).map(ref => {
    const target = resolveDef(lexicons, ref, facet.nsid)
    const name = target?.name === "main" ? target.nsid.split(".").at(-1) : target?.name
    const properties = Object.entries(target?.def?.properties ?? {})
    const uriProperty = properties.find(([, property]) => property.format === "uri")?.[0]
    const tagProperty = properties.find(([key, property]) => property.type === "string" && key === "tag")?.[0]
    return [name, { $type: fullRef(ref, facet.nsid), uriProperty, tagProperty }]
  }))
  return { features, index: { startProperty, endProperty } }
}

/**
 * The markdown, shaped as an object a content lexicon describes: its
 * required properties filled, the first string among `markdown`,
 * `content` or `text` holding the markdown, a required ref followed.
 * Undefined when the shape asks for something else.
 * @param {any} def
 * @param {string} from
 * @param {string} markdown
 * @param {Lexicons} lexicons
 * @param {number} [depth]
 * @returns {Record<string, unknown> | undefined}
 */
function markdownObject(def, from, markdown, lexicons, depth = 0) {
  if (def?.type !== "object" || depth > 4) return undefined
  const properties = def.properties ?? {}
  const slot = MARKDOWN_SLOTS.find(name => properties[name]?.type === "string")
  if (slot) {
    const others = (def.required ?? []).filter(name => name !== slot)
    return others.length ? undefined : { [slot]: markdown }
  }
  const nested = (def.required ?? []).map(name => {
    const property = properties[name]
    const target = property?.type === "ref" ? resolveDef(lexicons, property.ref, from) : undefined
    const inner = target ? markdownObject(target.def, target.nsid, markdown, lexicons, depth + 1) : undefined
    return [name, inner]
  })
  if (!nested.length || nested.some(([, inner]) => !inner)) return undefined
  return Object.fromEntries(nested)
}

/**
 * The body for the record's body property, in the form its schema asks
 * for.
 * @param {string} name - `content` or `text`
 * @param {any} property
 * @param {any} record - the record's object schema
 * @param {string} nsid
 * @param {Page} page
 * @param {{ lexicons: Lexicons, context: Context }} env
 * @returns {{ values: Record<string, unknown> } | { reason: string }}
 */
function bodyValues(name, property, record, nsid, page, env) {
  const facets = record.properties?.facets
  if (property.type === "string" && facets?.type === "array") {
    const shape = facetShape(facets, nsid, env.lexicons)
    const { text, spans } = page.richText(shape?.features ?? {})
    const trimmed = trimWords(text, property.maxGraphemes, property.maxLength)
    const values = shape ? { [name]: trimmed, facets: facetsFor(trimmed, spans, shape.index) } : { [name]: trimmed }
    return { values }
  }
  if (property.type === "string") return { values: { [name]: page.markdown() } }

  const markdown = page.markdown()
  const candidates = property.type === "union"
    ? [...(property.refs ?? []).map(ref => fullRef(ref, nsid)), ...(property.closed ? [] : [env.context.contentLexicon])]
    : property.type === "ref" ? [fullRef(property.ref, nsid)] : []
  const built = candidates
    .map(ref => ({ ref, target: resolveDef(env.lexicons, ref, nsid) }))
    .map(({ ref, target }) => ({ ref, object: target ? markdownObject(target.def, target.nsid, markdown, env.lexicons) : undefined }))
    .find(candidate => candidate.object)
  if (!built) return { reason: `has no shape vowel can put markdown in` }
  const value = property.type === "union" ? { $type: built.ref, ...built.object } : built.object
  return { values: { [name]: value } }
}

/**
 * The page as a record of `nsid`.
 * @param {string} nsid
 * @param {Page} page
 * @param {{ lexicons: Lexicons, context: Context }} env
 * @returns {{ record: Record<string, unknown>, warnings: string[] } | { ignored: string, warnings: string[] }}
 */
function mapRecord(nsid, page, env) {
  const main = env.lexicons.get(nsid)?.defs?.main
  if (!main) return { ignored: `${nsid} is not published`, warnings: [] }
  if (main.type !== "record") return { ignored: `${nsid} is not a record lexicon`, warnings: [] }
  if (!["tid", "any"].includes(main.key)) return { ignored: `${nsid}'s record key is "${main.key}", which vowel doesn't publish to`, warnings: [] }

  const record = main.record
  const properties = record.properties ?? {}
  const has = (name) => name in properties
  const dateField = has("publishedAt") ? "publishedAt" : has("createdAt") ? "createdAt" : undefined
  const aliases = {
    title: page.title,
    name: page.title,
    description: page.description,
    tags: page.tags?.length ? page.tags : undefined,
    image: page.image,
    ...(dateField ? { [dateField]: page.date } : {})
  }
  const standardSite = nsid.startsWith("site.standard.")
    ? { site: env.context.publication ?? env.context.origin, path: env.context.path }
    : {}

  // Frontmatter by name first, then an alias, then the standard.site rule.
  const found = Object.fromEntries(Object.keys(properties).map(name => {
    const written = byName(page.frontmatter, name)
    if (written !== undefined) return [name, written]
    if (ALIAS_KEYS.has(name) && aliases[name] !== undefined) return [name, aliases[name]]
    return [name, standardSite[name]]
  }).filter(([, value]) => value !== undefined))

  const bodyName = BODY_KEYS.find(name => has(name) && !(name in found))
  const body = bodyName ? bodyValues(bodyName, properties[bodyName], record, nsid, page, env) : { values: {} }
  const bodyWarnings = "reason" in body ? [`${bodyName} ${body.reason}; left out`] : []
  const values = { ...("values" in body ? body.values : {}), ...found }

  const fitted = fitObject(values, record, nsid, env)
  if (!fitted.ok) return { ignored: `a ${nsid} record ${fitted.reason}`, warnings: bodyWarnings }
  return { record: { $type: nsid, ...fitted.value }, warnings: [...bodyWarnings, ...(fitted.warnings ?? [])] }
}

export { mapRecord, fit, trimWords, facetShape, markdownObject }
