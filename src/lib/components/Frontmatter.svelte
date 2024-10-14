<script>
	import { FrontmatterProperty, FrontmatterTaxonomy } from './';

	/**
	 * @typedef {import("../utilities/processMarkdownFiles").MarkdownFile} MarkdownFile
	 */

	/**
	 * @type {{props: {properties: MarkdownFile}}}
	 */
	let { props } = $props();
	// TODO: Normalize frontmatter props
	let { properties, website, format } = $derived(props);
	const keys = $derived(Object.keys(properties || {}));

	const excludedProperties = [
		'title',
		'description',
		'type',
		'ast',
		'url',
		'frontmatter',
		'published',
		'date',
		'image',
		'breadcrumb',
		'imputedProperties',
		'toc'
	];

	// const { website } = $page.data;

	/**
	 * Fetch a given property from a page.
	 * @param {MarkdownFile} properties - A markdown file.
	 * @param {string} key - The name of a property
	 * @returns {any}
	 */
	function getProperty(properties, key) {
		// @ts-ignore
		return properties[key];
	}
</script>

{#if properties}
	{#each keys as key}
		{#if !excludedProperties.includes(key)}
			{@const property = getProperty(properties, key)}
			{#if website.hasOwnProperty(key)}
				<FrontmatterTaxonomy {property} {key} {website} />
			{:else}
				<FrontmatterProperty {property} {key} {format} />
			{/if}
		{/if}
	{/each}
{/if}
