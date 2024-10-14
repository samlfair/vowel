<script>
	import { sentenceCase } from 'change-case';
	import Frontmatter from './Frontmatter.svelte';
	import Image from './Markdown/Image.svelte';

	/** @type {{ property: any, key: string }}*/
	let { property, key, format } = $props();
</script>

{#if property}
	<dl class={key}>
		<dt>{sentenceCase(key)}</dt>
		<dd>
			{@render propertySwitch(property)}
		</dd>
	</dl>
{/if}

{#snippet array(items)}
	<ul>
		{#each items as item}
			<li>
				{@render propertySwitch(item)}
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet propertySwitch(value)}
	{#if value.type === 'array'}
		{@render array(value.output)}
	{:else if value.type === 'object'}
		<Frontmatter props={{ properties: value.output, format }} />
	{:else if value.type === 'image'}
		{@render image(value.output)}
	{:else if value.type === 'date'}
		{@render date(value.output)}
	{:else if value.type === 'url'}
		{@render url(value.output)}
	{:else}
		{value.output || value}
	{/if}
{/snippet}

{#snippet image(value)}
	<Image node={{ url: value, alt: '' }} />
{/snippet}

{#snippet date(value)}
	{@const date = new Date(value)}
	<time datetime={date.toISOString()}>{date.toLocaleDateString('en-US')}</time>
{/snippet}

{#snippet url(value)}
	{#if format === 'rss'}
		<a href={value.url}>
			{value.title || value['og:title']}
		</a>
	{:else}
		<article class="link-preview">
			<a href={value.url}>
				{#if value['og:image']}
					<img src={value['og:image']} alt="" />
				{/if}
				<h2>
					{value.title || value['og:title']}
				</h2>
				<p>
					{value['og:description'] || value.og_description || value.description}
				</p>
			</a>
		</article>
	{/if}
{/snippet}

{#snippet pdf(value)}
	<a href={value.url}>{value.url}</a>
{/snippet}
