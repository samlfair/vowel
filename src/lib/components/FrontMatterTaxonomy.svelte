<script>
	import { sentenceCase } from 'change-case';
	// @ts-ignore
	import { getFileLabel, getPage } from '$lib/utilities';

	/** @type {{ property: any, key: string }}*/
	let { property, key, website } = $props();

	const path = key + '/' + property;
	const page = getPage(website, path);

	/**
	 * Check if a value is an object
	 * @param {any} value - Value to check.
	 * @returns {boolean}
	 */
	function isObject(value) {
		return typeof value === 'object' && !Array.isArray(value) && value !== null;
	}

	/**
	 * Check if a value is an object
	 * @param {any} value - Value to check.
	 * @returns {boolean}
	 */
	function isArray(value) {
		return typeof value === 'object' && Array.isArray(value) && value !== null;
	}
</script>

<dl>
	<dt class={key}>{sentenceCase(key)}</dt>
	<dd class={key}>
		{#if isArray(property)}
			<ul>
				{#each property as item}
					{@const path = key + '/' + item}
					{@const page = getPage(website, path)}
					<li>
						<a href={page.url}>{getFileLabel(page)}</a>
					</li>
				{/each}
			</ul>
		{:else}
			<a href={page.url}>{getFileLabel(page)}</a>
		{/if}
	</dd>
</dl>
