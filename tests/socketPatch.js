import test from "node:test"
import assert from "node:assert/strict"
import { parseHTML } from "linkedom"

/**
 * The live-reload client's DOM morph, run under linkedom. The two
 * functions are module-private, so they are reached by evaluating the
 * module against a window: what matters is the observable result on
 * the document.
 */
async function load(html) {
  const { window, document } = parseHTML(html)
  globalThis.window = window
  globalThis.document = document
  globalThis.DOMParser = window.DOMParser
  globalThis.WebSocket = class { addEventListener() {} }
  const module = await import("../plugins/html/editor/socket.js?" + Math.random())
  return { window, document, openSocket: module.default }
}

function push(document, html) {
  // Reach the message handler the way the socket would. What is pushed
  // is the file as written, which never carries the injected client
  // script - that is added at serve time.
  const handlers = document.__handlers
  const data = html.replace(/<script type="module">[\s\S]*?<\/script>/, "")
  handlers.message({ data: JSON.stringify({ extension: ".html", path: "page.html", data }) })
}

async function setup(served) {
  const ctx = await load(served)
  // Stand in for the socket: capture listeners so a message can be fed.
  ctx.document.__handlers = {}
  globalThis.WebSocket = class {
    constructor() { this.readyState = 1 }
    addEventListener(name, fn) { ctx.document.__handlers[name] = fn }
    send() {}
  }
  globalThis.window.location = { host: "x", pathname: "/page" }
  ctx.openSocket()
  return ctx
}

const page = (title, description, body, extraLink = "") => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><link rel="stylesheet" href="/a.css?111">${extraLink}</head><body class="page"><header><a id="title" href="/">Site</a></header><main><h1>${title}</h1><section id="content">${body}</section></main><footer>f</footer><script type="module">/* client */</script></body></html>`

test("a content edit patches title, og tags and body in place - no reload", async () => {
  const { document, window } = await setup(page("Old", "Old desc", "<p>old</p>"))
  let reloaded = false
  window.location.reload = () => { reloaded = true }
  const link = document.head.querySelector("link")
  const script = document.body.querySelector("script")

  push(document, page("New", "New desc", "<p>new</p>"))

  assert.equal(reloaded, false)
  assert.equal(document.title, "New")
  assert.equal(document.head.querySelector('meta[property="og:description"]').getAttribute("content"), "New desc")
  assert.equal(document.querySelector("#content").innerHTML, "<p>new</p>")
  assert.equal(document.head.querySelector("link"), link, "an unchanged <link> is the same node, not re-created")
  assert.equal(document.body.querySelector("script"), script, "the injected client script survives")
})

test("a new stylesheet is added, a removed one goes, and the rest are untouched", async () => {
  const { document } = await setup(page("T", "d", "<p>x</p>"))
  const a = document.head.querySelector('link[href="/a.css?111"]')

  push(document, page("T", "d", "<p>x</p>", '<link rel="stylesheet" href="/b.css?222">'))
  assert.deepEqual([...document.head.querySelectorAll("link")].map(l => l.getAttribute("href")), ["/a.css?111", "/b.css?222"])
  assert.equal(document.head.querySelector('link[href="/a.css?111"]'), a)

  push(document, page("T", "d", "<p>x</p>").replace('<link rel="stylesheet" href="/a.css?111">', '<link rel="stylesheet" href="/a.css?333">'))
  assert.deepEqual([...document.head.querySelectorAll("link")].map(l => l.getAttribute("href")), ["/a.css?333"])
})

test("client-mounted elements in the body survive a patch", async () => {
  const { document } = await setup(page("T", "d", "<p>x</p>"))
  const launcher = document.createElement("div")
  launcher.setAttribute("data-vowel-client", "")
  launcher.className = "edit-launcher"
  document.body.appendChild(launcher)
  const panel = document.createElement("aside")
  panel.setAttribute("data-vowel-client", "")
  panel.className = "settings-drawer"
  document.body.appendChild(panel)

  push(document, page("T2", "d", "<p>y</p>"))

  assert.equal(document.querySelector(".edit-launcher"), launcher)
  assert.equal(document.querySelector(".settings-drawer"), panel)
  assert.equal(document.querySelector("#content").innerHTML, "<p>y</p>")
  assert.equal(document.querySelectorAll("aside").length, 1, "the page has no aside; only the panel")
})

test("while the editor is mounted, <main> is left alone and everything else still patches", async () => {
  const { document } = await setup(page("T", "d", "<p>x</p>"))
  document.documentElement.dataset.vowelEditing = "true"
  const main = document.querySelector("main")
  main.querySelector("#content").innerHTML = "<p>being edited</p>"

  push(document, page("T", "d", "<p>from the save</p>").replace("<footer>f</footer>", "<footer>g</footer>"))

  assert.equal(document.querySelector("main"), main)
  assert.equal(document.querySelector("#content").innerHTML, "<p>being edited</p>")
  assert.equal(document.querySelector("footer").textContent, "g")
})

test("a push with no data still reloads - the one honest case", async () => {
  const { document, window } = await setup(page("T", "d", "<p>x</p>"))
  let reloaded = false
  window.location.reload = () => { reloaded = true }
  document.__handlers.message({ data: JSON.stringify({ extension: ".html", path: "page.html", data: null }) })
  assert.equal(reloaded, true)
})
