import {
  Session,
  SelectAllCommand,
  InsertDefaultNodeCommand,
  AddNewLineCommand,
  BreakTextNodeCommand,
  UndoCommand,
  RedoCommand,
  SelectParentCommand,
  ToggleMarkCommand,
  define_document_schema,
  fill_document_defaults,
  define_keymap
} from "svedit"

import Overlays from "./Overlays.svelte"
import ingest from "./ingest.js"
import {
  Page,
  Paragraph,
  Heading,
  List,
  ListItem,
  Blockquote,
  Alert,
  CodeBlock,
  ThematicBreak,
  Image,
  Embed,
  Strong,
  Emphasis,
  InlineCode,
  Highlight,
  Strikethrough,
  Link
} from "./nodes/index.js"

// The faithful subset of vowel's generated HTML - everything the MD -> HTML
// conversion emits as distinct semantic markup, plus the two node kinds that
// stand in for content it generates rather than renders (image, embed).
const INLINE_MARKS = ["strong", "emphasis", "inline_code", "highlight", "strikethrough", "link"]

const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "list",
  "blockquote",
  "alert",
  "code_block",
  "thematic_break",
  "image",
  "embed"
]

const document_schema = define_document_schema({
  page: {
    kind: "document",
    properties: {
      body: {
        type: "node_array",
        node_types: BLOCK_TYPES,
        default_node_type: "paragraph"
      }
    }
  },
  paragraph: {
    kind: "text",
    properties: {
      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: true }
    }
  },
  heading: {
    kind: "text",
    properties: {
      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: false },
      level: { type: "integer", min: 1, max: 6, default: 2 }
    }
  },
  list: {
    kind: "block",
    properties: {
      items: { type: "node_array", node_types: ["list_item"], default_node_type: "list_item" },
      ordered: { type: "boolean", default: false }
    }
  },
  list_item: {
    kind: "text",
    properties: {
      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: false }
    }
  },
  blockquote: {
    kind: "block",
    properties: {
      body: { type: "node_array", node_types: BLOCK_TYPES, default_node_type: "paragraph" }
    }
  },
  // > [!NOTE] - the variant is what the html plugin encodes in the class.
  alert: {
    kind: "block",
    properties: {
      variant: { type: "string", default: "note" },
      body: { type: "node_array", node_types: BLOCK_TYPES, default_node_type: "paragraph" }
    }
  },
  code_block: {
    kind: "block",
    properties: {
      code: { type: "string", default: "" },
      language: { type: "string", default: "" }
    }
  },
  thematic_break: {
    kind: "block",
    properties: {}
  },
  // source is the canonical asset path from the <picture>; html is the
  // served markup, kept so edit mode looks identical to the page.
  image: {
    kind: "block",
    properties: {
      source: { type: "string", default: "" },
      alt: { type: "string", default: "" },
      caption: { type: "string", default: "" },
      html: { type: "string", default: "" }
    }
  },
  // A directive that expanded into generated content. Opaque by design.
  embed: {
    kind: "block",
    properties: {
      directive: { type: "string", default: "" },
      html: { type: "string", default: "" }
    }
  },
  strong: { kind: "mark", properties: {} },
  emphasis: { kind: "mark", properties: {} },
  inline_code: { kind: "mark", properties: {} },
  highlight: { kind: "mark", properties: {} },
  strikethrough: { kind: "mark", properties: {} },
  link: { kind: "mark", properties: { href: { type: "string", default: "" } } }
})

// Only non-numeric ids are valid in Svedit because document paths are built
// from mixed string and number segments.
function generate_id(length = 16) {
  const id_alphabet = "abcdefghijklmnopqrstuvwxyz"
  const random_values = crypto.getRandomValues(new Uint8Array(length))
  return [...random_values].map(value => id_alphabet[value % id_alphabet.length]).join("")
}

const session_config = {
  generate_id,
  system_components: {
    overlays: Overlays
  },
  node_components: {
    page: Page,
    paragraph: Paragraph,
    heading: Heading,
    list: List,
    list_item: ListItem,
    blockquote: Blockquote,
    alert: Alert,
    code_block: CodeBlock,
    thematic_break: ThematicBreak,
    image: Image,
    embed: Embed,
    strong: Strong,
    emphasis: Emphasis,
    inline_code: InlineCode,
    highlight: Highlight,
    strikethrough: Strikethrough,
    link: Link
  },

  /**
   * @param {object} context - The svedit context with session, editable, canvas.
   * @returns {{ commands: object, keymap: object }}
   */
  create_commands_and_keymap: (context) => {
    const commands = {
      select_all: new SelectAllCommand(context),
      insert_default_node: new InsertDefaultNodeCommand(context),
      add_new_line: new AddNewLineCommand(context),
      break_text_node: new BreakTextNodeCommand(context),
      undo: new UndoCommand(context),
      redo: new RedoCommand(context),
      select_parent: new SelectParentCommand(context),
      toggle_strong: new ToggleMarkCommand("strong", context),
      toggle_emphasis: new ToggleMarkCommand("emphasis", context),
      toggle_inline_code: new ToggleMarkCommand("inline_code", context),
      toggle_highlight: new ToggleMarkCommand("highlight", context),
      toggle_strikethrough: new ToggleMarkCommand("strikethrough", context)
    }

    const keymap = define_keymap({
      "meta+a,ctrl+a": [commands.select_all],
      enter: [commands.break_text_node, commands.insert_default_node],
      // In case of a node cursor, fall back to inserting a default node. This
      // is needed because on iOS selecting a node cursor triggers auto
      // capitalization (shift pressed)
      "shift+enter": [commands.add_new_line, commands.insert_default_node],
      "meta+z,ctrl+z": [commands.undo],
      "meta+shift+z,ctrl+shift+z": [commands.redo],
      escape: [commands.select_parent],
      "meta+b,ctrl+b": [commands.toggle_strong],
      "meta+i,ctrl+i": [commands.toggle_emphasis]
    })

    return { commands, keymap }
  },

  inserters: {
    paragraph: function (tr, content = { content: "", marks: [], annotations: [] }) {
      const new_paragraph = {
        id: session_config.generate_id(),
        type: "paragraph",
        content
      }
      tr.create(new_paragraph)
      tr.insert_nodes([new_paragraph.id])
      // NOTE: Relies on insert_nodes selecting the newly inserted node(s)
      tr.set_selection({
        type: "text",
        path: [...tr.selection.path, tr.selection.focus_offset - 1, "content"],
        anchor_offset: 0,
        focus_offset: 0
      })
    }
  }
}

/**
 * Builds a session from the rendered page. #content is the source of truth;
 * an element the allowlist does not recognise fails the whole ingest rather
 * than being guessed at, so the editor stays read-only instead of silently
 * rewriting content it did not understand.
 *
 * @param {Element} element the #content section of the previewed page
 * @returns {{session: Session|null, unrecognised: string[]}}
 */
export default function create_session(element) {
  const { doc, unrecognised } = ingest(element, generate_id)

  if (!doc) return { session: null, unrecognised }

  const filled = fill_document_defaults(doc, document_schema)
  return { session: new Session(document_schema, filled, session_config), unrecognised: [] }
}
