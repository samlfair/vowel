<script>
	let { metadata, url, format } = $props();
	let { image, description, og_description, author } = $derived(metadata || {});

	const href = $derived(metadata?.og_url || metadata?.canonical || url || '');

	const title = $derived(metadata?.og_title || metadata?.title || '');

	const urlObject = new URL(url);
</script>

{#if metadata}
	{#if format === 'rss'}
		<p><a {href}>{title ? title + ' - ' : ''}{urlObject.host}</a></p>
	{:else}
		<article class="link-preview">
			<a {href}>
				{#if image}
					<img src={image} alt="" />
				{/if}
				<h2>{title ? title + ' - ' : ''}<span class="host">{urlObject.host}</span></h2>
				{#if author}
					<p>
						By {author}
					</p>
				{/if}
				{#if description || og_description}
					<p>
						{description || og_description}
					</p>
				{/if}
			</a>
		</article>
	{/if}
{:else if format === 'rss'}
	<p><a {href}>{urlObject.host}</a></p>
{:else}
	<article class="link-preview">
		<a {href}>
			<h2>
				<span class="host">{urlObject.host}</span>
			</h2>
		</a>
	</article>
{/if}
