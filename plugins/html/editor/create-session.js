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
} from 'svedit';

import Overlays from './Overlays.svelte';
import { Page, Text, Highlight, Strong } from './nodes/index.js';

const document_schema = define_document_schema({
  page: {
    kind: 'document',
    properties: {
      body: {
        type: 'node_array',
        node_types: ['paragraph'],
        default_node_type: 'paragraph'
      }
    }
  },
  paragraph: {
    kind: 'text',
    properties: {
      content: {
        type: 'text',
        mark_types: ["highlight", "strong"],
        allow_newlines: false
      }
    }
  },
  highlight: {
    kind: 'mark',
    properties: {}
  },
  strong: {
    kind: "mark",
    properties: {}
  }
});

const doc = {
  document_id: 'page_a',
  nodes: {
    text_a: {
      id: 'text_a',
      type: 'paragraph',
      content: {
        content: 'Text and structured content in symbiosis',
        marks: [],
        annotations: []
      }
    },
    page_a: {
      id: 'page_a',
      type: 'page',
      body: {
        nodes: ['text_a'],
        marks: [],
        annotations: []
      }
    }
  }
};

// Only non-numeric ids are valid in Svedit because document paths are built from mixed string and number segments.
function generate_id(length = 16) {
  const id_alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const random_values = crypto.getRandomValues(new Uint8Array(length));
  let id = '';

  for (const random_value of random_values) {
    id += id_alphabet[random_value % id_alphabet.length];
  }

  return id;
}

// App-specific config object, always available via doc.config for introspection
const session_config = {
  generate_id,
  system_components: {
    overlays: Overlays
  },
  // Registry of components for each node type
  node_components: {
    page: Page,
    paragraph: Text,
    highlight: Highlight,
    strong: Strong
  },
  /**
   * Factory function to create Svedit commands and keymap.
   * Called by Svedit component with the svedit context.
   *
   * @param {object} context - The svedit context with doc, editable, canvas.
   * @returns {{ commands: object, keymap: object }}
   */
  create_commands_and_keymap: (context) => {
    // Create command instances with the provided context
    const commands = {
      select_all: new SelectAllCommand(context),
      insert_default_node: new InsertDefaultNodeCommand(context),
      add_new_line: new AddNewLineCommand(context),
      break_text_node: new BreakTextNodeCommand(context),
      undo: new UndoCommand(context),
      redo: new RedoCommand(context),
      select_parent: new SelectParentCommand(context),
      toggle_strong: new ToggleMarkCommand('strong', context),
      toggle_highlight: new ToggleMarkCommand('highlight', context)
    };

    // Define keymap binding keys to commands
    const keymap = define_keymap({
      'meta+a,ctrl+a': [commands.select_all],
      enter: [commands.break_text_node, commands.insert_default_node],
      // In case of a node cursor, fall back to inserting a default node. This is needed
      // because on iOS selecting a node cursor triggers auto capitalization (shift pressed)
      'shift+enter': [commands.add_new_line, commands.insert_default_node],
      'meta+z,ctrl+z': [commands.undo],
      'meta+shift+z,ctrl+shift+z': [commands.redo],
      escape: [commands.select_parent],
      'meta+b,ctrl+b': [commands.toggle_strong]
    });

    return { commands, keymap };
  },

  // Custom functions to insert new "blank" nodes and setting the selection depening on the
  // intended behavior.
  inserters: {
    paragraph: function(tr, content = { content: '', marks: [], annotations: [] }) {
      const new_paragraph = {
        id: session_config.generate_id(),
        type: 'paragraph',
        content
      };
      tr.create(new_paragraph);
      tr.insert_nodes([new_paragraph.id]);
      // NOTE: Relies on insert_nodes selecting the newly inserted node(s)
      tr.set_selection({
        type: 'text',
        path: [...tr.selection.path, tr.selection.focus_offset - 1, 'content'],
        anchor_offset: 0,
        focus_offset: 0
      });
    }
  }
};

export default function create_session(element) {
  console.log("hey")
  const demo_doc = fill_document_defaults(doc, document_schema);
  console.log({ demo_doc })
  const session = new Session(document_schema, demo_doc, session_config);
  console.log({ session })
  return session;
}
