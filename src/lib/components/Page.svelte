<script>
	import { Markdown, Frontmatter } from '$lib/components';
	import { toString } from 'mdast-util-to-string';
	import { kebabCase } from 'change-case';
	import Image from './Markdown/Image.svelte';

	let { page, content = true, link, level = 0, website = {}, format = 'html', webmentions } = $props();
	let { ast, title, date, image, imputedProperties } = $derived(page || {});

	let headerImage = $derived(image?.output || !content && imputedProperties.image)

	const dateObject = date?.type === 'date' && new Date(date.output);
	// TODO: Add conditional logic for format = 'xml'

	const headings = ast.filter((child) => child.type === 'heading');
</script>

<!-- Image -->
{#if headerImage}
	{#if link}
		<a href={page.url} class="image">
			<Image node={{ url: headerImage, alt: '' }} />
		</a>
	{:else}
		<Image node={{ url: headerImage, alt: '' }} />
	{/if}
{/if}

<!-- Title -->
{#if title}
	{#if link && page.url}
		<h1>
			<a href={page.url}>
				{page.imputedProperties.title || title || page.imputedProperties?.fileName}
			</a>
		</h1>
	{:else}
		<h1 class="p-name">{page.imputedProperties.title || title || page.imputedProperties?.fileName}</h1>
	{/if}
{/if}

<!-- Date -->
{#if link}
	{#if dateObject}
		<time class="dt-published" datetime={dateObject.toISOString()}>
			<a href={page.url}>
				{dateObject.toLocaleDateString()}
			</a>
		</time>
	{/if}
{:else if dateObject}
	<time datetime={dateObject.toISOString()}>{dateObject.toLocaleDateString()}</time>
{/if}

<Frontmatter props={{ properties: page, website, format }} />

{#if page?.description || (!content && page?.imputedProperties?.description)}
	<p class="description p-summary">{page?.description || page?.imputedProperties.description}</p>
{/if}

{#if format === 'html' && page.toc && headings.length > 1}
	<dl class="contents">
		<dt>Contents</dt>
		<dd>
			<ul>
				{#each headings as heading, index}
					{@const headingString = toString(heading.children)}
					<li class={`heading depth-${heading.depth}`}>
						<a href={`#${kebabCase(headingString)}`}>{headingString}</a>
					</li>
				{/each}
			</ul>
		</dd>
	</dl>
{/if}

{#if level < 2 && content}
	<section class="content e-content">
		<Markdown props={{ ast, level, website, format }} />
	</section>
{/if}

{#if level < 2 && content && website._?.webmentions && webmentions?.children?.length}
	<section class="webmentions">
		<h2>Webmentions</h2>
		{#each webmentions.children as webmention}
			<a href={webmention.url} target="_blank">{webmention.url}</a>
		{/each}
	</section>
{/if}