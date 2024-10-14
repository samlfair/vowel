<script>
	import { getFileLabel } from '$lib/utilities';
	import { getFolderLabel, isActiveLink } from '../utilities';

	let { section, key, root, segments } = $props();

	const element = section['_'] ? 'ul' : 'div';
</script>

<!-- TODO: Add a sort -->

{#if typeof section === 'object'}
	<ul>
		{#if root}
			<li class="home">
				<a aria-current={isActiveLink(segments)} href={section['$'].url}>
					{getFileLabel(section['$']) || getFolderLabel(section)}
				</a>
			</li>
		{/if}
		{#each Object.keys(section) as key}
			{#if Object.keys(section[key]).length === 1 && section[key].$ && !section[key].$.date && !key.startsWith('$')}
				<li class={key}>
					<a aria-current={isActiveLink(segments, key)} href={section[key].$.url}>
						{getFileLabel(section[key]['$'], true) || getFolderLabel(section[key], true)}
					</a>
				</li>
			{:else if section[key].$ && !section[key].$.date && !key.startsWith('$')}
				<li class={key}>
					<a aria-current={isActiveLink(segments, key)} href={section[key].$.url}>
						{getFileLabel(section[key]['$']) || getFolderLabel(section[key])}
					</a>
					<svelte:self section={section[key]} segments={segments.slice(1)} {key} />
				</li>
			{/if}
		{/each}
	</ul>
{/if}
