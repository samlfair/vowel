<script>
	import { untrack } from 'svelte';
	import { serialize_path } from 'svedit';

	// Trimmed down from Svedit's demo Toolbar: no Icon/NodeNavigator components
	// (this project doesn't have them), and only the commands this project's
	// create-session.js actually registers (bold, highlight, undo/redo,
	// select-parent, delete). Buttons use plain-text glyphs instead of icons.
	let {
		session,
		editable = $bindable(false)
	} = $props();

	function toggle_editable() {
		if (editable) {
			session.selection = null;
		}
		editable = !editable;
	}

	let selection_type = $derived(session.selection?.type ?? null);

	// Check if we have a collapsed node selection (node caret)
	let is_node_caret = $derived(
		session.selection?.type === 'node' &&
			session.selection.anchor_offset === session.selection.focus_offset
	);

	// Get default node_type for current node_array
	let default_node_type = $derived.by(() => {
		if (!is_node_caret) return null;

		const node_array_path = session.selection.path;
		const node_array_node = session.get(node_array_path.slice(0, -1)); // Get the parent node
		const node_array_property = node_array_path.at(-1); // Get the property name

		const node_schema = session.schema[node_array_node?.type];
		if (!node_schema) return null;

		const property_definition = node_schema.properties[node_array_property];
		if (property_definition?.type !== 'node_array') return null;

		return (
			property_definition.default_node_type ||
			(property_definition.node_types?.length === 1 ? property_definition.node_types[0] : null)
		);
	});

	let can_insert_default = $derived(
		Boolean(is_node_caret && default_node_type && session.config.inserters?.[default_node_type])
	);

	let can_delete = $derived(selection_type === 'node' || selection_type === 'property');

	function insert_default_node(event) {
		event.preventDefault();
		const inserter = default_node_type ? session.config.inserters?.[default_node_type] : null;
		if (!is_node_caret || !inserter) return;

		const tr = session.tr;
		inserter(tr);
		session.apply(tr);
	}

	function delete_node_selection(event) {
		event.preventDefault();
		if (!can_delete) return;
		session.apply(session.tr.delete_selection('backward'));
	}

	function select_parent(event) {
		event.preventDefault();
		if (session.commands.select_parent?.disabled) return;
		session.commands.select_parent?.execute();
	}

	// While a pointer drags a selection the floating toolbar stays hidden,
	// otherwise it flickers along the growing selection. It appears
	// instantly on pointer up.
	let is_dragging = $state(false);

	function handle_window_pointerdown(event) {
		// Presses on the toolbars themselves must not hide them
		if (event.target instanceof Element && event.target.closest('.editor-toolbar')) return;
		is_dragging = true;
	}

	function handle_window_pointerup() {
		is_dragging = false;
	}

	// Anchor for the floating toolbar. Every selectable element exposes
	// anchor-name: --{serialized_path}, so the toolbar attaches to the element
	// owning the current selection with pure CSS anchor positioning.
	// last_node_anchor (multi-node only) is the last selected node's path,
	// exposed as --last-selected-node-anchor for a position-try fallback.
	let floating_anchor = $derived.by(() => {
		if (!editable) return null;
		const sel = session.selection;
		if (!sel) return null;

		if (sel.type === 'text') {
			// No toolbar at a collapsed text caret: it would hover over the
			// line above while the user is typing.
			if (sel.anchor_offset === sel.focus_offset) return null;
			return { name: serialize_path(sel.path) };
		}

		if (sel.type === 'property') {
			return { name: serialize_path(sel.path) };
		}

		if (sel.type === 'node') {
			const start = Math.min(sel.anchor_offset, sel.focus_offset);
			const end = Math.max(sel.anchor_offset, sel.focus_offset);
			if (start !== end) {
				return {
					name: serialize_path([...sel.path, start]),
					...(end - start > 1 ? { last_node_anchor: serialize_path([...sel.path, end - 1]) } : {})
				};
			}
			// Node caret: nothing to offer here yet (this project has no
			// gap-insert tool configured), the bottom toolbar's insert
			// button covers it instead.
			return null;
		}

		return null;
	});

	// Distance the visual viewport bottom sits above the layout viewport
	// bottom. Chromium and Firefox resize the layout viewport when the
	// virtual keyboard opens (interactive-widget=resizes-content), so this
	// stays 0 there. iOS Safari only shrinks and pans the visual viewport,
	// so the bottom toolbar must be translated up by this inset to stay
	// visible above the keyboard, also while scrolling.
	let keyboard_inset = $state(0);

	$effect(() => {
		const visual_viewport = window.visualViewport;
		if (!visual_viewport) return;

		let current = untrack(() => keyboard_inset);
		let target = current;
		let raf = 0;

		function measure() {
			target = Math.max(
				0,
				Math.round(window.innerHeight - visual_viewport.height - visual_viewport.offsetTop)
			);
			if (!raf) raf = requestAnimationFrame(follow);
		}

		// Exponential follower: large distances (keyboard opening) are covered
		// within a few frames while the small stale-position corrections that
		// Safari reports during touch pans get smoothed instead of rendering
		// as jitter. Speed adapts to the remaining distance by construction.
		function follow() {
			raf = 0;
			const delta = target - current;
			if (Math.abs(delta) <= 1) {
				current = target;
			} else {
				current += delta * 0.35;
				raf = requestAnimationFrame(follow);
			}
			keyboard_inset = current;
		}

		measure();
		visual_viewport.addEventListener('resize', measure);
		visual_viewport.addEventListener('scroll', measure);
		return () => {
			cancelAnimationFrame(raf);
			visual_viewport.removeEventListener('resize', measure);
			visual_viewport.removeEventListener('scroll', measure);
		};
	});
</script>

{#snippet divider()}
	<span class="divider" aria-hidden="true"></span>
{/snippet}

<!-- Way back up the node hierarchy, like Notion's << button in its text
     formatting toolbar. Repeated presses ascend text -> node -> parent node
     etc. Hidden entirely at the top level where there is no parent, and
     pinned to the left edge of a scrollable bar so it stays reachable. -->
{#snippet select_parent_button()}
	{#if session.commands.select_parent && !session.commands.select_parent.disabled}
		<span class="select-parent-group">
			<button title="Select parent (Esc)" onmousedown={select_parent}>&#8598;</button>
			{@render divider()}
		</span>
	{/if}
{/snippet}

{#snippet mark_buttons()}
	{#if session.commands.toggle_strong}
		<button
			title="Bold"
			class="bold"
			onmousedown={(event) => {
				event.preventDefault();
				session.commands.toggle_strong.execute();
			}}
			disabled={session.commands.toggle_strong.disabled}
			class:active={session.commands.toggle_strong.active}
		>
			B
		</button>
	{/if}
	{#if session.commands.toggle_highlight}
		<button
			title="Highlight"
			class="highlight"
			onmousedown={(event) => {
				event.preventDefault();
				session.commands.toggle_highlight.execute();
			}}
			disabled={session.commands.toggle_highlight.disabled}
			class:active={session.commands.toggle_highlight.active}
		>
			H
		</button>
	{/if}
{/snippet}

{#snippet insert_button()}
	<button title="Insert (↵)" onmousedown={insert_default_node} disabled={!can_insert_default}>
		<svg
			class="toolbar-icon"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path d="M7.5 3V12M3 7.5H12" stroke="currentColor" stroke-linecap="square" />
		</svg>
	</button>
{/snippet}

{#snippet delete_button()}
	<button title="Delete backwards (⌫)" onmousedown={delete_node_selection} disabled={!can_delete}
		>&#9003;</button
	>
{/snippet}

<!-- Rendered unconditionally: commands register only after Svedit has
     initialized, and the persistent bottom bar must not reflow on first
     paint when undo/redo appear. Until then the buttons are disabled. -->
{#snippet history_buttons()}
	<button
		title="Undo"
		onmousedown={(event) => {
			event.preventDefault();
			session.commands.undo?.execute();
		}}
		disabled={session.commands.undo?.disabled ?? true}
	>
		&#8630;
	</button>
	<button
		title="Redo"
		onmousedown={(event) => {
			event.preventDefault();
			session.commands.redo?.execute();
		}}
		disabled={session.commands.redo?.disabled ?? true}
	>
		&#8631;
	</button>
{/snippet}

<svelte:window
	onpointerdown={handle_window_pointerdown}
	onpointerup={handle_window_pointerup}
	onpointercancel={handle_window_pointerup}
/>

{#if floating_anchor && !is_dragging}
	<!-- Re-mount the toolbar whenever the anchor changes: swapping
	     position-anchor on a persistent fixed element can leave it at the
	     stale position of the previous anchor. -->
	{#key floating_anchor.name}
		<div
			class="editor-toolbar floating-toolbar"
			class:has-last-node-anchor={Boolean(floating_anchor.last_node_anchor)}
			style="position-anchor: --{floating_anchor.name};{floating_anchor.last_node_anchor
				? ` --last-selected-node-anchor: --${floating_anchor.last_node_anchor};`
				: ''}"
		>
			<div class="toolbar-scroller">
				<!-- Only the tools that belong to the current selection context: text
				     selections get text tools, node/property selections just get
				     select-parent + delete (no per-type navigator in this project yet). -->
				{#if selection_type === 'text'}
					{@render select_parent_button()}
					{@render mark_buttons()}
				{:else if selection_type === 'node' || selection_type === 'property'}
					{@render select_parent_button()}
					{@render delete_button()}
				{/if}
			</div>
		</div>
	{/key}
{/if}

<div class="editor-toolbar bottom-toolbar" style:--keyboard-inset="{keyboard_inset}px">
	<div class="toolbar-scroller">
		{#if editable}
			<!-- Same contextual composition as the floating toolbar: text tools for
			     text selections, just the insert button at node gaps, select-parent
			     + delete for node/property selections. -->
			<div class="contextual-tools">
				{#if selection_type === 'text'}
					{@render select_parent_button()}
					{@render mark_buttons()}
					{@render divider()}
				{:else if is_node_caret}
					{#if can_insert_default}
						{@render insert_button()}
						{@render divider()}
					{/if}
				{:else if selection_type === 'node' || selection_type === 'property'}
					{@render select_parent_button()}
					{@render divider()}
				{/if}
			</div>
			{@render history_buttons()}
			{#if can_delete}
				<!-- Destructive action last, behind undo/redo: harder to hit by
				     accident while scrolling the bar, and undo sits right next to
				     it when it does happen. -->
				<div class="contextual-tools">
					{@render divider()}
					{@render delete_button()}
				</div>
			{/if}
		{/if}
		<!-- Save pinned to the right edge of the scroller so it never needs
		     scrolling. -->
		<div class="save-group" class:has-leading-tools={editable}>
			{#if editable}
				{@render divider()}
			{/if}
			<button class="toggle-editable" onclick={toggle_editable}>
				{editable ? 'Save' : 'Edit'}
			</button>
		</div>
	</div>
</div>

<style>
	/* Both toolbars share one unified pill container: a single surface,
	   border and shadow instead of per-button bubbles. The pill itself does
	   not scroll — scrolling lives in the unpadded inner scroller below, so
	   pinned (sticky) tools sit at the exact scrollport edge and scrolled
	   content can never leak into the pill's padding or rounded corners. */
	.editor-toolbar {
		display: flex;
		align-items: center;
		width: fit-content;
		padding: 4px;
		color: var(--foreground, #111);
		background: var(--background, #fff);
		border: 1px solid oklch(from var(--foreground, #111) l c h / 0.12);
		border-radius: 9999px;
		box-shadow:
			0 1px 2px oklch(0% 0 0 / 0.12),
			0 4px 16px oklch(0% 0 0 / 0.08);
		z-index: 50;
		pointer-events: auto;
		max-width: calc(100vw - 2 * var(--s-4, 16px));
	}

	.toolbar-scroller {
		display: flex;
		flex-direction: row;
		align-items: center;
		/* No gap between buttons: adjacent hitboxes tile the toolbar without
		   dead zones, the visual spacing comes from the icon padding inside
		   each 36px button. */
		gap: 0;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
		border-radius: 9999px;
	}

	.bottom-toolbar {
		position: fixed;
		bottom: max(var(--s-4, 16px), env(safe-area-inset-bottom, 0px));
		right: var(--s-4, 16px);
	}

	@position-try --stay-in-viewport {
		position-area: none;
		position-anchor: none;
		top: calc(var(--top-toolbar-safe-area, 0px) + var(--s-2, 8px));
		right: auto;
		bottom: auto;
		left: auto;
	}

	/* Multi-node selection: when above the first node overflows, sit below
	   the last selected node instead (--last-selected-node-anchor). */
	@position-try --below-last-node {
		position-anchor: var(--last-selected-node-anchor);
		bottom: auto;
		top: anchor(bottom);
		margin-bottom: 0;
		margin-top: var(--s-2, 8px);
	}

	.floating-toolbar {
		position: fixed;
		bottom: anchor(top);
		justify-self: anchor-center;
		margin-bottom: var(--s-2, 8px);
		position-visibility: always;
		position-try-fallbacks: --stay-in-viewport, flip-block;
		z-index: 60;
	}

	.floating-toolbar.has-last-node-anchor {
		position-try-fallbacks: --below-last-node, --stay-in-viewport, flip-block;
	}

	/* The floating toolbar targets precise mouse interactions. On touch
	   devices all tools live in the single bottom toolbar instead, so the
	   virtual keyboard handling only has one element to care about. */
	@media (hover: none), (pointer: coarse) {
		.floating-toolbar {
			display: none;
		}

		.bottom-toolbar {
			right: auto;
			left: 50%;
			transform: translateX(-50%) translateY(calc(-1 * var(--keyboard-inset, 0px)));
		}
	}

	.contextual-tools {
		display: contents;
	}

	@media (hover: hover) and (pointer: fine) {
		.bottom-toolbar .contextual-tools {
			display: none;
		}
	}

	.editor-toolbar .save-group {
		position: sticky;
		right: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		flex: none;
		background: var(--background, #fff);
	}

	.editor-toolbar .save-group.has-leading-tools {
		margin-inline-start: 4px;
	}

	.editor-toolbar .save-group .divider {
		margin-inline-start: 0;
	}

	.editor-toolbar .divider {
		flex: none;
		width: 1px;
		height: 20px;
		margin-inline: 4px;
		background: oklch(from var(--foreground, #111) l c h / 0.15);
	}

	.editor-toolbar button:not(.toggle-editable) {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: 36px;
		height: 36px;
		min-width: 36px;
		min-height: 36px;
		aspect-ratio: 1 / 1;
		padding: 0;
		flex: 0 0 36px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--foreground, #111);
		font-size: 15px;
		font-weight: 600;
		text-wrap: nowrap;
		cursor: pointer;
		pointer-events: auto;
		transition:
			background 150ms,
			transform 150ms;
		outline: 1px solid transparent;
		position: relative;
	}

	@media (hover: hover) {
		.editor-toolbar button:not(.toggle-editable):hover:not(:disabled) {
			background: oklch(from var(--foreground, #111) l c h / 0.06);
		}
	}

	.editor-toolbar button:not(.toggle-editable):active:not(:disabled) {
		background: oklch(from var(--foreground, #111) l c h / 0.09);
		transform: translateY(1px) scale(0.95);
	}

	.editor-toolbar button:not(.toggle-editable):focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 1px var(--editing, #2563eb);
	}

	.editor-toolbar button:not(.toggle-editable):disabled {
		background: transparent;
		cursor: not-allowed;
		color: oklch(from var(--foreground, #111) l c h / 0.3);
	}

	.editor-toolbar button:not(.toggle-editable).active {
		color: var(--editing, #2563eb);
		background: var(--editing-muted, oklch(0.6 0.15 250 / 0.12));
	}

	/* Select-parent pinned to the left edge of the scroller, mirroring the
	   keyboard tools on the right. */
	.editor-toolbar .select-parent-group {
		position: sticky;
		left: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		flex: none;
		background: var(--background, #fff);
		margin-inline-end: 4px;
	}

	.editor-toolbar .select-parent-group .divider {
		margin-inline-end: 0;
	}

	.toggle-editable {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		height: 36px;
		min-height: 36px;
		flex: none;
		padding: 0 1rem;
		border: none;
		border-radius: 9999px;
		background: transparent;
		color: var(--editing, #2563eb);
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		pointer-events: auto;
		transition:
			background 150ms,
			transform 150ms;
		outline: 1px solid transparent;
	}

	@media (hover: hover) {
		.toggle-editable:hover {
			background: oklch(from var(--editing, #2563eb) l c h / 0.08);
		}
	}

	.toggle-editable:active {
		background: oklch(from var(--editing, #2563eb) l c h / 0.12);
		transform: translateY(1px) scale(0.97);
	}

	.toggle-editable:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 1px var(--editing, #2563eb);
	}

	.editor-toolbar .toolbar-icon {
		width: var(--icon-size, 18px);
		height: var(--icon-size, 18px);
		color: currentColor;
	}
</style>
