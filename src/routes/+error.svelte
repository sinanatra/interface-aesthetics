<script>
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { SITE } from '$lib/content';
</script>

<svelte:head><title>{page.status} — {SITE}</title></svelte:head>

<article class="md">
	<h1>{page.status === 404 ? 'Not found' : page.error?.message}</h1>
	<p><a href="{base}/">Back to the start</a></p>
</article>
