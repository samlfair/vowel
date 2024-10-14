<script>
	let { children, component, ...rest } = $props();
</script>

{#if component}
	<svelte:component this={component} {...rest}>
		{@render children()}
	</svelte:component>
{/if}
{@render children()}
