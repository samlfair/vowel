<script>
	import styles from './TypographyStyles.css?inline';
	import ResetStyles from './ResetStyles.svelte';
</script>

<ResetStyles />

<svelte:head>
  {@html `<style>${styles}</style>`}
</svelte:head>
