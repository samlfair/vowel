<script>
	import { page } from '$app/stores';
	import {
		Nav,
		Page,
		Breadcrumbs,
		Sitemap,
		ResetStyles,
		DefaultStyles,
		TypographyStyles,
		NoStyles
	} from '$lib/components/index.js';
	import { invalidateAll } from '$app/navigation';

	const themes = {
		none: NoStyles,
		reset: ResetStyles,
		typography: TypographyStyles,
		default: DefaultStyles
	};

	let { error: data } = $page;

	const { website } = $derived(data);

	const { slogan, theme } = $derived(website?._);

	// Import CSS for HMR in dev mode
	if (data.dev && data.files.css.exists) {
		import(/* @vite-ignore */ data.files.css.path);
	}

	const siteTitle = website._.title;

	function makePageMetaTitle() {
		if (siteTitle) return `Page not found = ${siteTitle}`;
		return `Page not found`;
	}

	function getFavicon() {
		if (website._?.icon)
			return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 20 90 60%22><text y=%22.9em%22 font-size=%2290%22>${website._.icon}</text></svg>`;
		if (data.files.favicon.exists) return '/favicon.png';
		return false;
	}

	const favicon = getFavicon();

	$effect(() => {
		// Update website on file change
		if (import.meta.hot) {
			import.meta.hot.on('vowel:update', ({ path, file }) => {
				invalidateAll().then(() => {
					window.location.reload();
				});
			});
			import.meta.hot.on('vowel:refresh', () => {
				console.log('Refresh');
				invalidateAll().then(() => {
					window.location.reload();
				});
			});
		}
	});
</script>

<svelte:component this={themes[theme || 'default']} />

<svelte:head>
	<title>{makePageMetaTitle()}</title>
	<meta property="og:site_name" content={website._.title} />
	{#if favicon}
		<link rel="icon" href={favicon} />
	{/if}
	{#if !data.dev && data.files.css.exists}
		<link rel="stylesheet" href="/styles.css" />
	{/if}
</svelte:head>

<div data-sveltekit-preload-data="hover" class="page 404">
	<header>
		{#if website._.logo}
			<a href="/" class="site-logo">
				{#if website._.logo.endsWith('.svg')}
					<object type="image/svg+xml" data={website._.logo} title={website._.title || undefined}
					></object>
				{:else}
					<img alt="website logo" src={website._.logo} />
				{/if}
			</a>
		{/if}
		{#if siteTitle}
			<a href="/" class="site-title">{siteTitle}</a>
		{/if}
		{#if website._.slogan}
			<p class="slogan">{website._.slogan}</p>
		{/if}
		<Nav folder={website} segments={['']} />
	</header>
	<main>
		<h1>Page Not Found</h1>
	</main>
	<nav class="sidebar">
		<Sitemap section={website} segments={['']} root />
	</nav>
	<footer>
		© {website._.author ? website._.author + ' ' : ''}
		{new Date().getFullYear()}
	</footer>
</div>
