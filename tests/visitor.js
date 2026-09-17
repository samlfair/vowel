import test from "node:test"
import assert from "node:assert/strict"
import { createVisitor, SKIP } from "../plugins/markdown/visitor.js"

const text = (value) => ({ type: "text", value })
const p = (...children) => ({ type: "element", tagName: "p", properties: {}, children })
const el = (tagName, ...children) => ({ type: "element", tagName, properties: {}, children })
const root = (...children) => ({ type: "root", children })

const shout = { name: "shout", pattern: /!(\w+)!/, resolve: (match) => el("strong", text(match[1])) }
const emoji = { name: "emoji", pattern: /:(\w+):/, resolve: (match) => match[1] === "smile" ? text("😀") : null }

test("visitor: inline rules split a text node around the earliest match, and the walk continues after the pieces", () => {
  const tree = root(p(text("a !b! c :smile: d :nope: e !f!")))
  createVisitor({ inline: [shout, emoji] })(tree, {})

  const children = tree.children[0].children
  assert.deepEqual(children.map(node => node.type === "text" ? node.value : `<${node.tagName}>`), [
    "a ", "<strong>", " c ", "😀", " d :nope: e ", "<strong>"
  ])
  assert.equal(children[1].children[0].value, "b")
})

test("visitor: an earlier match wins whatever the rule order; a tie goes to the first rule", () => {
  const tree = root(p(text(":smile: !x!")))
  createVisitor({ inline: [shout, emoji] })(tree, {})
  assert.equal(tree.children[0].children[0].value, "😀")

  const both = { name: "both", pattern: /!x!/, resolve: () => text("BOTH") }
  const tie = root(p(text("!x!")))
  createVisitor({ inline: [shout, both] })(tie, {})
  assert.equal(tie.children[0].children[0].tagName, "strong", "shout was listed first")
})

test("visitor: a rule never sees its own output, and a resolve of null leaves the text as written", () => {
  const nested = { name: "nested", pattern: /\[(\w+)\]/, resolve: (match) => text(`[${match[1]}]`) }
  const tree = root(p(text("[a]")))
  createVisitor({ inline: [nested] })(tree, {})
  assert.deepEqual(tree.children[0].children, [text("[a]")])

  const untouched = root(p(text("nothing here")))
  createVisitor({ inline: [shout] })(untouched, {})
  assert.deepEqual(untouched.children[0].children, [text("nothing here")])
})

test("visitor: skip() keeps inline rules out of code, and a skipped node's children are not visited", () => {
  const tree = root(el("pre", el("code", text("!keep! :smile:"))), p(text("!go!")))
  createVisitor({
    inline: [shout, emoji],
    skip: (node) => node.tagName === "pre" || node.tagName === "code"
  })(tree, {})
  assert.deepEqual(tree.children[0].children[0].children, [text("!keep! :smile:")])
  assert.equal(tree.children[1].children[0].tagName, "strong")
})

test("visitor: a block rule that mutates in place is descended into; one that returns nodes is not", () => {
  const seen = []
  const alert = {
    name: "alert",
    test: (node) => node.tagName === "blockquote",
    transform: (node) => { node.tagName = "aside" }
  }
  const card = {
    name: "card",
    test: (node) => node.tagName === "p" && node.children[0]?.value === "card",
    transform: () => el("article", p(text("!made!")))
  }
  const spy = { name: "spy", pattern: /!(\w+)!/, resolve: (match) => { seen.push(match[1]); return null } }

  const tree = root(el("blockquote", p(text("!inside!"))), p(text("card")), p(text("!after!")))
  createVisitor({ inline: [spy], block: [alert, card] })(tree, {})

  assert.equal(tree.children[0].tagName, "aside")
  assert.equal(tree.children[1].tagName, "article")
  assert.deepEqual(seen, ["inside", "after"], "the card's own text was not visited")
})

test("visitor: a block rule returning SKIP leaves the node and its children alone; returning an array splices several", () => {
  const seen = []
  const leave = { name: "leave", test: (node) => node.tagName === "nav", transform: () => SKIP }
  const split = { name: "split", test: (node) => node.tagName === "hr", transform: () => [p(text("one")), p(text("two"))] }
  const spy = { name: "spy", pattern: /(\w+)/, resolve: (match) => { seen.push(match[1]); return null } }

  const tree = root(el("nav", p(text("menu"))), el("hr"), p(text("end")))
  createVisitor({ inline: [spy], block: [leave, split] })(tree, {})

  assert.deepEqual(tree.children.map(node => node.tagName), ["nav", "p", "p", "p"])
  assert.deepEqual(seen, ["end"])
})

test("visitor: a rule receives the context, and the first matching block rule wins", () => {
  const first = { name: "first", test: (node) => node.tagName === "p", transform: (node, index, parent, context) => { context.hits.push("first") } }
  const second = { name: "second", test: (node) => node.tagName === "p", transform: (node, index, parent, context) => { context.hits.push("second") } }
  const context = { hits: [] }
  createVisitor({ block: [first, second] })(root(p(text("x"))), context)
  assert.deepEqual(context.hits, ["first"])
})

test("visitor: works on mdast too - text leaves under any container", () => {
  const tree = { type: "root", children: [{ type: "paragraph", children: [text("hi !there!")] }] }
  createVisitor({ inline: [{ name: "shout", pattern: /!(\w+)!/, resolve: (match) => ({ type: "strong", children: [text(match[1])] }) }] })(tree, {})
  assert.deepEqual(tree.children[0].children, [text("hi "), { type: "strong", children: [text("there")] }])
})
