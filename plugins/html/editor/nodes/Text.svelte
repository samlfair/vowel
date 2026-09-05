<script>
	import { getContext } from 'svelte';
	import { Node, TextProperty } from 'svedit';

	const svedit = getContext('svedit');
	let { path } = $props();
	let node = $derived(svedit.session.get(path));
	let layout = $derived(node.layout || 1);
	let text_style = $derived(get_text_style_from_layout(layout));
	let readable_text_type = $derived(get_readable_text_type_from_layout(layout));

	function get_text_style_from_layout(layout) {
		switch (layout) {
			case 1:
				return 'body';
			case 2:
				return 'heading1';
			case 3:
				return 'heading2';
			case 4:
				return 'heading3';
			default:
				return 'body';
		}
	}

	function get_readable_text_type_from_layout(layout) {
		switch (layout) {
			case 1:
				return 'Paragraph';
			case 2:
				return 'Heading 1';
			case 3:
				return 'Heading 2';
			case 4:
				return 'Heading 3';
			default:
				return 'Paragraph';
		}
	}
</script>

<Node {path}>
	<div class="text layout-{layout} mx-auto w-full max-w-5xl py-4">
		<TextProperty class={text_style} path={[...path, 'content']} placeholder={readable_text_type} />
	</div>
</Node>
