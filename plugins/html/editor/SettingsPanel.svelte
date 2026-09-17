<script>
	// The settings drawer.
	//
	// Full height down the left edge, and deliberately **not** modal: no
	// backdrop, the page behind stays scrollable and clickable. Live
	// preview is the whole point - you drag a slider and watch the
	// headings resize - so anything that blocks the page would defeat it.
	//
	// Every control is derived from data rather than hardcoded: the site
	// fields from `siteFields` below, the typography controls from the
	// same table the build emits type.css from (typography.js), so the
	// variables the panel writes for preview are the ones the sheet reads.
	import { rampSettings, typographyVariables } from '../../markdown/typography.js';
	import { fallbackColors } from '../../markdown/brandColors.js';
	import { readSettings, joinFrontmatter, themeObject, writeSettings } from './settings-file.js';

	let { onclose } = $props();

	let loading = $state(true);
	let error = $state(null);
	let saving = $state(false);

	// The whole file, so a save rewrites only what changed and leaves
	// every other key - and the body - alone.
	let file = $state({ data: {}, body: '' });

	// Held apart from `data` until a theme field is actually edited, so a
	// site that wrote `theme: default` keeps that spelling unless it has a
	// reason not to. Editing only the title must not silently rewrite the
	// theme into its object form.
	let editedTheme = $state(null);

	const theme = $derived(editedTheme ?? themeObject(file.data.theme));
	const colors = $derived([0, 1].map((index) => theme.colors?.[index] ?? fallbackColors[index]));

	// Top-level frontmatter keys, in the order they read as a form. Only
	// settings vowel actually consumes are here - `author` is in both demo
	// settings.md files and is read by nothing, so it isn't offered.
	const siteFields = [
		{ key: 'name', label: 'Name', hint: 'The site name, shown in the header' },
		{ key: 'tagline', label: 'Tagline', hint: 'Shown as the homepage hero' },
		{ key: 'breadcrumb', label: 'Breadcrumb', hint: 'Label for the site root in navigation' },
		{ key: 'domain', label: 'Domain', hint: 'Needed for the sitemap and feed' },
		{ key: 'icon', label: 'Icon', hint: 'An emoji, or a path to an image' },
		{ key: 'logo', label: 'Logo', hint: 'Path to an SVG or image' },
		{ key: 'wordmark', label: 'Wordmark', hint: 'Path to an SVG or image' }
	];

	// Setting a variable on the document is the whole of live preview:
	// TypographyStyles.css computes every heading level from these, so
	// the ramp recomputes as a slider moves. A key the author unsets goes
	// back to the sheet's default by removing the override.
	const preview = $derived(typographyVariables(theme));

	$effect(() => {
		const root = document.documentElement;
		const set = new Set(preview.map(([name]) => name));
		for (const { variable } of rampSettings) {
			if (!set.has(variable)) root.style.removeProperty(variable);
		}
		for (const [name, value] of preview) root.style.setProperty(name, value);
		// The colour scheme needs a rebuild to see: the ramps are generated
		// by colorhorse on the server.
	});

	$effect(() => {
		readSettings()
			.then((result) => (file = result))
			.catch((e) => (error = e.message))
			.finally(() => (loading = false));
	});

	function setField(key, value) {
		const data = { ...file.data };
		if (value === '') delete data[key];
		else data[key] = value;
		file = { ...file, data };
	}

	function setTheme(key, value) {
		// Clearing a field removes the key rather than writing `undefined`,
		// so the sheet's default takes over and settings.md stays clean.
		const { [key]: _, ...rest } = theme;
		editedTheme = value === undefined ? rest : { ...rest, [key]: value };
	}

	/** Both seeds are written together - colorhorse takes a pair. */
	function setColor(index, value) {
		setTheme('colors', colors.map((current, position) => (position === index ? value : current)));
	}

	async function save() {
		saving = true;
		error = null;

		const data = editedTheme ? { ...file.data, theme: editedTheme } : file.data;

		try {
			await writeSettings('settings.md', joinFrontmatter(data, file.body));
			// No reload: the write lands in sourceFolder, the watcher
			// rebuilds and votive's live-reload client patches the page - the
			// same path a hand edit takes.
			onclose();
		} catch (e) {
			error = e.message;
		} finally {
			saving = false;
		}
	}
</script>

<aside class="settings-drawer" aria-label="Site settings" data-vowel-client>
	<header>
		<h2>Settings</h2>
		<button class="close" onclick={onclose} title="Close settings">&#10005;</button>
	</header>

	{#if loading}
		<p class="note">Reading settings.md…</p>
	{:else}
		<section>
			<h3>Site</h3>
			{#each siteFields as field (field.key)}
				<label class="field">
					<span>{field.label}</span>
					<input
						type="text"
						value={file.data[field.key] ?? ''}
						placeholder={field.hint}
						title={field.hint}
						oninput={(event) => setField(field.key, event.currentTarget.value)}
					/>
				</label>
			{/each}
		</section>

		<section>
			<h3>Colors</h3>
			<p class="note">Two seeds; every shade on the site is generated from them.</p>
			{#each ['One', 'Two'] as label, index (label)}
				<label class="field color">
					<span>{label}</span>
					<input
						type="color"
						value={colors[index]}
						oninput={(event) => setColor(index, event.currentTarget.value)}
					/>
					<input
						type="text"
						class="hex"
						value={colors[index]}
						spellcheck="false"
						oninput={(event) => setColor(index, event.currentTarget.value)}
					/>
				</label>
			{/each}
		</section>

		<section>
			<h3>Typography</h3>
			<p class="note">Previews as you drag. Colours apply on save. A font family is set in your own stylesheet.</p>

			{#each rampSettings as setting (setting.key)}
				{@const current = Number(theme[setting.key] ?? setting.default)}
				<label class="slider" title={setting.hint}>
					<span>{setting.label}</span>
					<input
						type="range"
						min={setting.min}
						max={setting.max}
						step={setting.step}
						value={current}
						oninput={(event) => setTheme(setting.key, Number(event.currentTarget.value))}
					/>
					<output>{current}{setting.unit}</output>
				</label>
			{/each}
		</section>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<footer>
		<button class="save" onclick={save} disabled={saving || loading}>
			{saving ? 'Saving…' : 'Save'}
		</button>
	</footer>
</aside>

<style>
	/* Full height down the left edge. No backdrop and nothing fixed over
	   the page: the site stays usable while you edit, which is what makes
	   the live preview worth having. The page is not pushed aside either -
	   that would mean writing to the host document's own layout. */
	.settings-drawer {
		/* Physical, not logical: the drawer is injected into someone
		   else's document and would flip to the right edge on an RTL
		   page, which is not what "left" means here. */
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		z-index: 70;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: min(340px, 100vw);
		padding: 16px;
		overflow-y: auto;
		overscroll-behavior: contain;
		color: var(--foreground, #111);
		background: var(--background, #fff);
		border-right: 1px solid oklch(from var(--foreground, #111) l c h / 0.12);
		box-shadow: 0 0 24px oklch(0% 0 0 / 0.12);
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 4px;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0;
	}

	h3 {
		margin: 0 0 8px;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: oklch(from var(--foreground, #111) l c h / 0.55);
	}

	section {
		padding-block: 14px;
		border-top: 1px solid oklch(from var(--foreground, #111) l c h / 0.1);
	}

	.close {
		flex: none;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	@media (hover: hover) {
		.close:hover {
			background: oklch(from var(--foreground, #111) l c h / 0.06);
		}
	}

	.note {
		margin: 0 0 10px;
		color: oklch(from var(--foreground, #111) l c h / 0.6);
	}

	.error {
		margin: 10px 0 0;
		color: oklch(0.55 0.2 25);
	}

	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}

	.field > span {
		flex: none;
		width: 5.5rem;
		color: oklch(from var(--foreground, #111) l c h / 0.6);
	}

	.field.check {
		justify-content: flex-start;
	}

	input[type='text'],
	select {
		flex: 1;
		min-width: 0;
		box-sizing: border-box;
		height: 30px;
		padding: 0 6px;
		color: inherit;
		background: transparent;
		border: 1px solid oklch(from var(--foreground, #111) l c h / 0.2);
		border-radius: 8px;
		font: inherit;
	}

	input[type='text']:focus-visible,
	select:focus-visible {
		outline: none;
		border-color: var(--editing, #2563eb);
		box-shadow: inset 0 0 0 1px var(--editing, #2563eb);
	}

	/* The swatch and its hex edit the same value; the swatch is for
	   choosing, the field is for pasting one you already have. */
	.field.color input[type='color'] {
		flex: none;
		width: 34px;
		height: 30px;
		padding: 2px;
		background: transparent;
		border: 1px solid oklch(from var(--foreground, #111) l c h / 0.2);
		border-radius: 8px;
		cursor: pointer;
	}

	.hex {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		text-transform: lowercase;
	}

	fieldset {
		margin: 0 0 10px;
		padding: 8px 10px;
		border: 1px solid oklch(from var(--foreground, #111) l c h / 0.12);
		border-radius: 10px;
	}

	legend {
		padding: 0 4px;
		font-weight: 600;
	}

	.slider {
		display: grid;
		grid-template-columns: 2.25rem 1fr 3.25rem;
		align-items: center;
		gap: 6px;
	}

	.slider span {
		color: oklch(from var(--foreground, #111) l c h / 0.6);
	}

	.slider input {
		width: 100%;
		min-width: 0;
	}

	output {
		font-variant-numeric: tabular-nums;
		text-align: right;
		color: oklch(from var(--foreground, #111) l c h / 0.6);
	}

	/* Sticks to the bottom of the drawer, above the scrolling content. */
	footer {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: flex-end;
		margin-top: auto;
		padding-top: 12px;
		padding-bottom: 4px;
		background: var(--background, #fff);
	}

	.save {
		height: 32px;
		padding: 0 1rem;
		border: none;
		border-radius: 9999px;
		background: var(--editing, #2563eb);
		color: var(--background, #fff);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
