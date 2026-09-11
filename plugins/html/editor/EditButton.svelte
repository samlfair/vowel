<script>
	// The editor's entry point, and the only thing a previewed page carries
	// until it is pressed: everything Svedit needs is reached through
	// onedit (see main.js's startEditing), not from here.
	//
	// Styled as the same pill as Toolbar.svelte's bottom bar, which takes
	// this corner over once editing starts - so pressing Edit reads as the
	// button becoming the toolbar rather than as one widget replacing
	// another.
	let { onedit, onsettings } = $props();

	let editing = $state(false);

	// Non-empty once a press found elements ingest could not read. The page
	// can't be edited at all in that case (ingest fails whole-document),
	// so the button stays put and says so instead of disappearing.
	let unrecognised = $state([]);

	function start() {
		const failed = onedit();

		if (failed.length) {
			unrecognised = failed;
			return;
		}

		editing = true;
	}
</script>

{#if !editing}
	<div class="edit-launcher" data-vowel-client>
		<button
			class="edit settings"
			onclick={onsettings}
			title="Typography and theme settings"
		>
			Settings
		</button>
		<span class="divider" aria-hidden="true"></span>
		<button
			class="edit"
			onclick={start}
			disabled={unrecognised.length > 0}
			title={unrecognised.length
				? `This page can't be edited yet: ${unrecognised.join(', ')}`
				: 'Edit this page'}
		>
			{unrecognised.length ? "Can't edit" : 'Edit'}
		</button>
	</div>
{/if}

<style>
	/* Same surface as .editor-toolbar in Toolbar.svelte. Duplicated rather
	   than shared: scoped styles don't cross components, and a global
	   stylesheet injected into someone else's page is a collision waiting
	   to happen. */
	.edit-launcher {
		position: fixed;
		bottom: max(var(--s-4, 16px), env(safe-area-inset-bottom, 0px));
		right: var(--s-4, 16px);
		z-index: 50;
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
		pointer-events: auto;
	}

	/* Matches .toggle-editable, down to leaving font-family alone: the
	   toolbar's Save button inherits the UA button font too, and the two
	   sit in the same corner one after the other. */
	.edit {
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
		cursor: pointer;
		pointer-events: auto;
		transition:
			background 150ms,
			transform 150ms;
		outline: 1px solid transparent;
	}

	@media (hover: hover) {
		.edit:hover:not(:disabled) {
			background: oklch(from var(--editing, #2563eb) l c h / 0.08);
		}
	}

	.edit:active:not(:disabled) {
		background: oklch(from var(--editing, #2563eb) l c h / 0.12);
		transform: translateY(1px) scale(0.97);
	}

	.edit:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 1px var(--editing, #2563eb);
	}

	/* Separates the two actions inside the one pill, the same hairline
	   Toolbar.svelte uses between tool groups. */
	.divider {
		flex: none;
		width: 1px;
		height: 20px;
		margin-inline: 2px;
		background: oklch(from var(--foreground, #111) l c h / 0.15);
	}

	/* Secondary next to Edit: the same pill, in the text colour rather
	   than the accent, so Edit stays the one obvious action. */
	.settings {
		color: var(--foreground, #111);
		font-weight: 500;
	}

	@media (hover: hover) {
		.settings:hover:not(:disabled) {
			background: oklch(from var(--foreground, #111) l c h / 0.06);
		}
	}

	.settings:active:not(:disabled) {
		background: oklch(from var(--foreground, #111) l c h / 0.09);
	}

	.edit:disabled {
		color: oklch(from var(--foreground, #111) l c h / 0.4);
		cursor: not-allowed;
	}
</style>
