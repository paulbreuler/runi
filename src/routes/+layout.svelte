<script>
	import '../app.css';
	// Disable SSR for Tauri compatibility
	export const ssr = false;
	export const prerender = true;
</script>

<main>
	<slot />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>
