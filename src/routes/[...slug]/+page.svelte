<script>
  import { page } from "$app/state";
  import { SITE_URL } from "$lib/content";

  let { data } = $props();

  const url = $derived(SITE_URL + page.url.pathname);
</script>

<svelte:head>
  <title>{data.page.headTitle}</title>
  <meta name="description" content={data.page.description} />
  <link rel="canonical" href={url} />
  <meta property="og:title" content={data.page.headTitle} />
  <meta property="og:description" content={data.page.description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={data.page.cover} />
</svelte:head>

<article class={["md", data.home && "[&>h1:first-child]:hidden"]}>
  {@html data.page.html}
</article>
