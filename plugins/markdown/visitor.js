/**
 * One walk for every text-level utility. Rules are data; this is the
 * only traversal. Tree-agnostic: mdast at read, hast at transform and
 * write - both are `{type, children}` trees with `{type: "text", value}`
 * leaves, and a rule knows which one it is written for.
 *
 * Per node, in order: the block rules (first match wins, and what it
 * returns decides whether the walk descends); then `skip`, which keeps
 * inline rules out of code; then, for a text node, every inline rule in
 * one scan - the earliest match wins, ties go to rule order, `resolve()`
 * returning null leaves the text as written. The pieces replace the node
 * and the walk continues *after* them, so a rule never sees its own
 * output.
 *
 * Kept free of node builtins: the same rules could run in the browser.
 *
 * @typedef {{ type: string, value?: string, children?: Node[], [key: string]: any }} Node
 *
 * @typedef {object} InlineRule
 * @property {string} name
 * @property {RegExp} pattern - flags are ignored; the visitor scans with
 *   its own global copy
 * @property {(match: RegExpExecArray, context: any) => Node | Node[] | null} resolve
 *
 * @typedef {object} BlockRule
 * @property {string} name
 * @property {(node: Node, index: number, parent: Node) => boolean} test
 * @property {(node: Node, index: number, parent: Node, context: any) => Node | Node[] | typeof SKIP | undefined} transform
 *   `undefined`: mutated in place, descended into. A node or array:
 *   spliced in, not descended into - the rule made it. `SKIP`: left
 *   alone, not descended into.
 */

const SKIP = Symbol("skip")

/**
 * The point `index` characters into a text node, from the node's own
 * start: what an inline rule's node is given as its position, so a
 * warning about it (an unresolved wikilink) can name its line. Exact
 * for the line; the column can be off where the text's value differs
 * from the source - an escape earlier on the line, or a `> ` the
 * value doesn't hold.
 * @param {{ line: number, column: number, offset?: number }} start
 * @param {string} value
 * @param {number} index
 */
function pointAt(start, value, index) {
  const before = value.slice(0, index)
  const lines = before.split("\n")
  const offset = start.offset === undefined ? undefined : start.offset + index
  if (lines.length === 1) return { line: start.line, column: start.column + index, offset }
  return { line: start.line + lines.length - 1, column: lines.at(-1).length + 1, offset }
}

/**
 * Gives a rule's nodes the span of their match, unless the rule set
 * one. Nothing when the text node had no position (a node the build
 * made).
 * @param {Node[]} nodes
 * @param {Node} text - the text node the match is in
 * @param {RegExpExecArray} match
 */
function withPosition(nodes, text, match) {
  const start = text.position?.start
  if (!start) return nodes
  const span = {
    start: pointAt(start, text.value, match.index),
    end: pointAt(start, text.value, match.index + match[0].length)
  }
  return nodes.map(node => node.position || node.type === "text" ? node : { ...node, position: span })
}

/**
 * @param {object} rules
 * @param {InlineRule[]} [rules.inline]
 * @param {BlockRule[]} [rules.block]
 * @param {(node: Node) => boolean} [rules.skip] - not descended into
 * @returns {(tree: Node, context?: any) => void}
 */
function createVisitor({ inline = [], block = [], skip = () => false } = {}) {
  const scanners = inline.map(rule => ({ rule, pattern: new RegExp(rule.pattern.source, "g") }))

  /**
   * Text into the pieces the inline rules make of it. Returns null when
   * no rule matched, so an untouched node is left in place unchanged.
   * @param {Node} text - a text node
   * @param {any} context
   * @returns {Node[] | null}
   */
  function applyInline(text, context) {
    const value = text.value
    const pieces = []
    let cursor = 0
    let touched = false

    while (cursor < value.length) {
      const earliest = scanners.reduce((best, scanner) => {
        scanner.pattern.lastIndex = cursor
        const match = scanner.pattern.exec(value)
        if (!match || match[0].length === 0) return best
        if (best && best.match.index <= match.index) return best
        return { match, rule: scanner.rule }
      }, /** @type {{match: RegExpExecArray, rule: InlineRule} | null} */ (null))

      if (!earliest) break

      const { match, rule } = earliest
      const resolved = rule.resolve(match, context)
      const end = match.index + match[0].length

      if (resolved === null || resolved === undefined) {
        // Literal: keep scanning after it, as part of the same text run.
        cursor = end
        continue
      }

      touched = true
      const before = value.slice(pieces.length ? pieces.at(-1).end : 0, match.index)
      if (before) pieces.push({ end: match.index, nodes: [{ type: "text", value: before }] })
      pieces.push({ end, nodes: withPosition(Array.isArray(resolved) ? resolved : [resolved], text, match) })
      cursor = end
    }

    if (!touched) return null

    const tail = value.slice(pieces.at(-1).end)
    const nodes = pieces.flatMap(piece => piece.nodes)
    return tail ? [...nodes, { type: "text", value: tail }] : nodes
  }

  /**
   * @param {Node} node
   * @param {number} index
   * @param {Node} parent
   * @param {any} context
   * @returns {number} how many nodes now occupy the slot, for the caller
   *   to step over
   */
  function visitNode(node, index, parent, context) {
    const matched = block.find(rule => rule.test(node, index, parent))
    if (matched) {
      const result = matched.transform(node, index, parent, context)
      if (result === SKIP) return 1
      if (result !== undefined) {
        const nodes = Array.isArray(result) ? result : [result]
        parent.children.splice(index, 1, ...nodes)
        return nodes.length
      }
    }

    if (skip(node)) return 1

    if (node.type === "text" && typeof node.value === "string") {
      const pieces = applyInline(node, context)
      if (!pieces) return 1
      parent.children.splice(index, 1, ...pieces)
      return pieces.length
    }

    visitChildren(node, context)
    return 1
  }

  /**
   * @param {Node} node
   * @param {any} context
   */
  function visitChildren(node, context) {
    if (!Array.isArray(node.children)) return
    let index = 0
    while (index < node.children.length) {
      index += visitNode(node.children[index], index, node, context)
    }
  }

  return function walk(tree, context = {}) {
    visitChildren(tree, context)
  }
}

export { createVisitor, SKIP }
