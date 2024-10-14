<script>
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
	import { getPage, createPageClass } from '$lib/utilities/index.js';
	import getFileLabel from '../../lib/utilities/getFileLabel';
	import { error } from '@sveltejs/kit';
	import { getFolder, getFolderLabel } from '../../lib/utilities';
	import { page as pageStore } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	const themes = {
		none: NoStyles,
		reset: ResetStyles,
		typography: TypographyStyles,
		default: DefaultStyles
	};

	// propData is a workaround due to a seeming bug in Svelte
	let { data: propData } = $props();

	const data = $state(JSON.parse(JSON.stringify(propData, null, 2)))

	const { website, folderName } = $derived(data);

	const { slogan, theme } = $derived(website._);

	// Import CSS for HMR in dev mode
	if (data.dev && data.files.css.exists) {
		import(/* @vite-ignore */ data.files.css.path);
	}

	const page = $derived(getPage(website, data.path));

	if (!page || page.url === '/404') {
		throw error(404, { message: 'Page not found', ...data });
	}

	const websiteTitle = data.website._.title || data.folderName;
	const pageMetaTitle = $derived(getFileLabel(page));
	const siteTitle = website._.title;

	function getBreadcrumbs(level = 0) {
		const path = $pageStore.data.segments.slice(0, level).join('/');
		const crumbyPage = getFolder($pageStore.data.website, path);
		const folderLabel = getFolderLabel(crumbyPage);
		const active = level > $pageStore.data.segments.length;
		if (!active) return [folderLabel, ...getBreadcrumbs(level + 1)];
		return [];
	}

	function makePageMetaTitle() {
		if (page.url === '/') {
			if (slogan) return `${siteTitle || pageMetaTitle} - ${slogan}`;
			return siteTitle || pageMetaTitle;
		}

		const breadcrumbs = getBreadcrumbs().slice(1, -1).reverse();
		const breadcrumbSegment = breadcrumbs.length ? ` - ${breadcrumbs.join(' - ')} - ` : ' - ';
		return `${pageMetaTitle}${breadcrumbSegment}${siteTitle}`;
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
				if (path.endsWith('_')) {
					invalidateAll().then(() => {
						window.location.reload();
					});
				} else {
					let updatedPage = getPage(website, path);
					if (!updatedPage) {
						invalidateAll().then(() => {
							window.location.reload();
						});
					}

					for (const key in file) {
						if (!updatedPage[key]) updatedPage[key] = {};
						updatedPage[key] = file[key];
					}
				}
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
	<meta property="”og:url”" content={page.url} />
	<meta property="og:site_name" content={website._.title || folderName} />
	{#if page.hasOwnProperty('description') || page.imputedProperties?.hasOwnProperty('description')}
		<meta
			property="og:description"
			content={page.description || page.imputedProperties.description}
		/>
	{/if}
	{#if favicon}
		<link rel="icon" href={favicon} />
	{/if}
	{#if !data.dev && data.files.css.exists}
		<link rel="stylesheet" href="/styles.css" />
	{/if}
	{#if page.hasOwnProperty('image') || page.imputedProperties?.hasOwnProperty('image')}
		<meta property="og:image" content={page.image || page.imputedProperties.image} />
	{/if}
</svelte:head>

<div data-sveltekit-preload-data="hover" class={createPageClass(page.url, 'page')}>
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
		<Nav folder={website} segments={data.path.split('/')} />
		<nav class="breadcrumbs" aria-label="Breadcrumb">
			<Breadcrumbs level={0} />
		</nav>
	</header>
	<main>
		<Page level={0} {page} {website} path={data.path} />
	</main>
	<nav class="sidebar">
		<Sitemap section={website} segments={data.path.split('/')} root />
	</nav>
	<footer>
		© {website._.author ? website._.author + ' ' : ''}
		{new Date().getFullYear()}
	</footer>
</div>
