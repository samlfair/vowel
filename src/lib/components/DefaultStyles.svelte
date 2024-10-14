<script>
	import styles from './DefaultStyles.css?inline';

	import { TypographyStyles } from '.';
</script>

<TypographyStyles />

<svelte:head>
	{@html `<style>${styles}</style>`}
</svelte:head>
