<script>
	import { getFileLabel, getFolderLabel, isActiveLink } from '$lib/utilities';

	let { folder, segments, child } = $props();

	// There's definitely a better way to filter this
	function filterFolder(folder) {
		const filteredFolder = {};
		for (let key in folder) {
			if ((!folder[key]['$']?.date && !key.startsWith('$')) || key.length === 1) {
				filteredFolder[key] = folder[key];
			}
		}
		return filteredFolder;
	}

	const evergreen = $derived(filterFolder(folder));
</script>

{#if Object.keys(evergreen).some((key) => key !== '$' && key !== '_')}
	<nav class="top-bar">
		{#if !child}
			<a aria-current={isActiveLink(segments)} href={evergreen?.url || evergreen['$']?.url}
				>{getFolderLabel(evergreen, true)}</a
			>
		{/if}
		{#each Object.keys(evergreen) as key}
			{#if !key.match(/^[$_]$/) && key !== '.obsidian'}
				<a
					href={evergreen?.url || evergreen[key]['_']?.url || evergreen[key]['$']?.url}
					aria-current={isActiveLink(segments, key)}
					>{getFolderLabel(evergreen[key], true) || key}</a
				>
			{/if}
		{/each}
	</nav>
	{#if segments[0]}
		<svelte:self folder={evergreen[segments[0]]} segments={segments.slice(1)} child={true} />
	{/if}
{/if}
