<script>
	import Markdown from './index.svelte';

	let { node, level, website } = $props();
	let { url, children } = $derived(node);

	function isAbsoluteURL(url) {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	}
</script>

<a href={url} target={isAbsoluteURL(url) ? '_blank' : null}>
	<Markdown props={{ ast: children, level, website }} />
</a>
