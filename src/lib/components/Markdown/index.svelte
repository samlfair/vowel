<script>
	import { Page } from '$lib/components';
	import { getPage, getPagesByFolder, createPageClass, createFolderClass } from '$lib/utilities';
	import { getFolderAndCount, isFileLink } from './validators';
	import Image from './Image.svelte';
	import Link from './Link.svelte';
	import Text from './Text.svelte';
	import LinkPreview from './LinkPreview.svelte';
	import { toString } from 'mdast-util-to-string';
	import { kebabCase } from 'change-case';

	let { props } = $props();

	let { ast, level, website, format, identifier } = $derived(props);

	function getElement(node) {
		if (node.type === 'heading') {
			return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'div'][node.depth - 1];
		}
		const elements = {
			emphasis: 'em',
			text: 'span',
			paragraph: 'p',
			strong: 'strong',
			list: node.ordered ? 'ol' : 'ul',
			// listItem: 'li',
			blockquote: 'blockquote',
			inlineCode: 'code',
			code: 'pre',
			figure: 'figure',
			figcaption: 'figcaption',
			delete: 's',
			table: 'table',
			tableRow: 'tr',
			tableCell: 'td'
		};

		// Handle list item separately
		// Handle `pre` properly
		// Handle `footnoteDefinition` and `footnoteReference`

		if (elements[node.type]) return elements[node.type];
	}

	const noteTypes = {
		tip: 'Tip',
		note: 'Note',
		important: 'Important',
		warning: 'Warning',
		caution: 'Caution'
	};
</script>

{#if ast}
	{#each ast as node}
		{@const { count, path, property, content } = getFolderAndCount(node)}
		{#if count}
			{@const pages = getPagesByFolder(website, path, true, count, property)}
			<section class={createFolderClass(path)}>
				{#each pages as page}
					<article class={createPageClass(page.url, 'thumbnail')}>
						<Page link={true} {content} {page} level={level + 1} {website} {format} />
					</article>
				{/each}
			</section>
		{:else if isFileLink(node)}
			<article class={createPageClass(node.children[0].value, 'thumbnail')}>
				<Page
					link={true}
					page={getPage(website, node.children[0].value)}
					level={level + 1}
					{website}
					content={false}
					{format}
				/>
			</article>
		{:else if node.type === 'heading'}
			<svelte:element this={getElement(node)} id={kebabCase(toString(node))}>
				<svelte:self props={{ ast: node.children, level }} />
			</svelte:element>
		{:else if node.type === 'link' && node.children}
			<Link {node} {level} {website} {format} />
		{:else if node.type === 'thematicBreak'}
			<hr />
		{:else if node.type === 'image'}
			<Image {node} />
		{:else if node.type === 'url'}
			<!-- {@const dummy = console.log(node)} -->
			<LinkPreview url={node.url} metadata={node.metadata} {format} />
		{:else if node.type === 'listItem'}
			{@const isChecklistItem = node.checked !== null}
			{#if isChecklistItem}
				<li
					class={`checklist-item ${node.checked ? 'checked' : 'unchecked'}`}
					style:list-style-type={`"${node.checked ? '☑' : '☐'}"`}
				>
					<svelte:self props={{ ast: node.children, level, format }} />
				</li>
			{:else}
				<li>
					<svelte:self props={{ ast: node.children, level, format }} />
				</li>
			{/if}
		{:else if node.type === 'footnoteReference'}
			<sup
				><a
					href={`#footnote-definition-${node.identifier}`}
					id={`footnote-${node.identifier}`}
					aria-describedby="footnotes">{node.label}</a
				></sup
			>
		{:else if node.type === 'footnotes'}
			<section id="footnotes">
				<h2>Footnotes</h2>
				<ol>
					{#each node.children as footnote}
						<li id={`footnote-definition-${footnote.identifier}`}>
							<svelte:self
								props={{ ast: footnote.children, level, format, identifier: footnote.identifier }}
							/>
						</li>
					{/each}
				</ol>
			</section>
		{:else if node.type === 'containerDirective' && noteTypes[node.name]}
			<aside class={`alert ${node.name}`}>
				<h2>
					{noteTypes[node.name]}
				</h2>
				<svelte:self props={{ ast: node.children, level, format }}></svelte:self>
			</aside>
		{:else if node.children}
			<svelte:element this={getElement(node)}>
				<svelte:self props={{ ast: node.children, level, format }} />{#if identifier}<a
						href={`#footnote-${identifier}`}
						aria-label="Back to content">↩</a
					>{/if}
			</svelte:element>
		{:else if node.type === 'text'}
			<Text {node} />
		{:else}
			<svelte:element this={getElement(node)}>
				<Text {node} />
			</svelte:element>
		{/if}
	{/each}
{/if}
