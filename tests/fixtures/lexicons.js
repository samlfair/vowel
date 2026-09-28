import { createLexiconResolver } from "../../plugins/atproto/lexicons.js"

/**
 * Lexicons written for these tests, shaped like the ones in use - vowel
 * bundles none. `com.example.*` stands for any author's lexicon.
 */
const record = (properties, required = [], key = "tid") => ({ type: "record", key, record: { type: "object", required, properties } })
const FIXTURES = {
  "com.example.note": { lexicon: 1, id: "com.example.note", defs: { main: record({
    text: { type: "string", maxLength: 3000, maxGraphemes: 30 },
    facets: { type: "array", items: { type: "ref", ref: "com.example.facet" } },
    tags: { type: "array", maxLength: 2, items: { type: "string", maxGraphemes: 64 } },
    createdAt: { type: "string", format: "datetime" }
  }, ["text", "createdAt"]) } },
  "com.example.facet": { lexicon: 1, id: "com.example.facet", defs: {
    main: { type: "object", required: ["index", "features"], properties: {
      index: { type: "ref", ref: "#byteSlice" },
      features: { type: "array", items: { type: "union", refs: ["#link", "#tag", "#bold"] } }
    } },
    byteSlice: { type: "object", required: ["byteStart", "byteEnd"], properties: { byteStart: { type: "integer", minimum: 0 }, byteEnd: { type: "integer", minimum: 0 } } },
    link: { type: "object", required: ["uri"], properties: { uri: { type: "string", format: "uri" } } },
    tag: { type: "object", required: ["tag"], properties: { tag: { type: "string" } } },
    bold: { type: "object", properties: {} }
  } },
  "com.example.article": { lexicon: 1, id: "com.example.article", defs: { main: record({
    title: { type: "string", maxGraphemes: 20 },
    description: { type: "string" },
    content: { type: "union", refs: [] },
    text: { type: "string" },
    textContent: { type: "string" },
    publishedAt: { type: "string", format: "datetime" },
    createdAt: { type: "string", format: "datetime" },
    image: { type: "string", format: "uri" },
    cover: { type: "string", format: "uri" }
  }, ["title", "publishedAt"]) } },
  "com.example.markdown": { lexicon: 1, id: "com.example.markdown", defs: { main: { type: "object", required: ["body"], properties: { body: { type: "ref", ref: "#text" } } }, text: { type: "object", required: ["markdown"], properties: { markdown: { type: "string" }, flavor: { type: "string" } } } } },
  "com.example.event": { lexicon: 1, id: "com.example.event", defs: {
    main: record({
      name: { type: "string" },
      startsAt: { type: "string", format: "datetime" },
      mode: { type: "string", knownValues: ["com.example.event#inperson", "com.example.event#virtual"] },
      locations: { type: "array", items: { type: "union", refs: ["#address", "#uri"] } },
      theme: { type: "union", refs: ["#colour"] },
      attendees: { type: "integer", minimum: 0 },
      createdAt: { type: "string", format: "datetime" }
    }, ["name", "createdAt"]),
    address: { type: "object", required: ["country"], properties: { country: { type: "string", minLength: 2, maxLength: 10 }, postalCode: { type: "string" } } },
    uri: { type: "object", required: ["uri"], properties: { uri: { type: "string", format: "uri" } } },
    colour: { type: "object", required: ["r"], properties: { r: { type: "integer", minimum: 0, maximum: 255 } } },
    inperson: { type: "token" },
    virtual: { type: "token" }
  } },
  "com.example.profile": { lexicon: 1, id: "com.example.profile", defs: { main: record({ displayName: { type: "string" } }, [], "literal:self") } },
  "com.example.upload": { lexicon: 1, id: "com.example.upload", defs: { main: record({ file: { type: "blob" }, createdAt: { type: "string", format: "datetime" } }, ["file"]) } },
  "site.standard.page": { lexicon: 1, id: "site.standard.page", defs: { main: record({ site: { type: "string", format: "uri" }, path: { type: "string" }, title: { type: "string" } }, ["site", "title"]) } }
}

/**
 * A resolver over FIXTURES, through the real resolution path: a TXT
 * record per authority, a DID document, a getRecord. `seen` counts the
 * schema fetches.
 */
function fixtureResolver() {
  const seen = []
  const fetch = async (url) => {
    const parsed = new URL(url)
    if (parsed.hostname === "plc.test") return Response.json({ service: [{ id: "#atproto_pds", serviceEndpoint: "https://pds.test" }] })
    const nsid = parsed.searchParams.get("rkey")
    seen.push(nsid)
    return FIXTURES[nsid] ? Response.json({ value: FIXTURES[nsid] }) : Response.json({ error: "RecordNotFound" }, { status: 400 })
  }
  const resolveTxt = async (name) => {
    if (name === "_lexicon.example.unpublished.com") throw Object.assign(new Error("queryTxt ENODATA"), { code: "ENODATA" })
    return [["did=did:plc:", "lexicons"]]
  }
  return { resolver: createLexiconResolver({ resolveTxt, plcDirectory: "https://plc.test", fetch }), seen }
}

/** standard.site's document and MarkPub's markdown, as far as the tests need them. */
FIXTURES["site.standard.document"] = { lexicon: 1, id: "site.standard.document", defs: { main: record({
  site: { type: "string", format: "uri" },
  path: { type: "string" },
  title: { type: "string", maxGraphemes: 500 },
  description: { type: "string" },
  tags: { type: "array", items: { type: "string" } },
  content: { type: "union", refs: [] },
  textContent: { type: "string" },
  publishedAt: { type: "string", format: "datetime" }
}, ["site", "title", "publishedAt"]) } }
FIXTURES["at.markpub.markdown"] = { lexicon: 1, id: "at.markpub.markdown", defs: { main: { type: "object", required: ["text"], properties: { text: { type: "ref", ref: "at.markpub.text" } } } } }
FIXTURES["at.markpub.text"] = { lexicon: 1, id: "at.markpub.text", defs: { main: { type: "object", required: ["markdown"], properties: { markdown: { type: "string" } } } } }

export { FIXTURES, fixtureResolver }
