<script>
	import { page } from '$app/stores';
	import { getFolderLabel, getFolder } from '$lib/utilities';

	let { level } = $props();

	const path = $derived($page.data.segments.slice(0, level).join('/'));
	// The page for the current crumb
	const crumbyPage = $derived(getFolder($page.data.website, path));
	const folderLabel = $derived(getFolderLabel(crumbyPage, true, false));

	const active = $derived(level === $page.data.segments.length);
</script>

<a aria-current={active ? 'page' : undefined} href={crumbyPage?.['$'].url}>{folderLabel}</a>
{#if !active}
	<span aria-hidden="true" class="separator"></span>
	<svelte:self level={level + 1} />
{/if}
