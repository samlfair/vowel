<script>
	let { node } = $props();
	let { url, alt } = node;

	let defaultWidth = 800;
	const srcsetWidths = [640, 828, 1080, 1200, 1920, 2048, 3840];

	let urlObject = createURLObject();

	function createURLObject() {
		try {
			return new URL(url);
		} catch (e) {
			// console.error(`Error on image ${url}:`);
			// console.error(e);
		}
	}

	let srcset = createSrcset();

	function createSrcset() {
		if (urlObject?.host.includes('imgix.net')) {
			urlObject?.searchParams.set('width', String(defaultWidth));
			urlObject?.searchParams.append('auto', 'format,compress');

			return srcsetWidths.reduce((srcset, width) => {
				urlObject?.searchParams.set('width', width);
				return `${srcset}, ${urlObject?.href} ${width}w`;
			}, '');

			urlObject?.searchParams.set('width', String(defaultWidth));
		}
	}
</script>

{#if urlObject?.pathname?.endsWith('.svg')}
	<object type="image/svg+xml" data={urlObject.href} title={alt}></object>
{:else if urlObject}
	<img src={urlObject.href} {alt} {srcset} />
{/if}

<style>
	img {
		transition: max-width 1s linear;
		max-width: 100%;
		height: auto;
		width: auto;
		margin-inline: auto;
	}
</style>
