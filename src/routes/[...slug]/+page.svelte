<script>
  let { data } = $props();
</script>

<svelte:head><title>{data.page.headTitle}</title></svelte:head>

<article class={["md", data.home && "[&>h1:first-child]:hidden"]}>
  {@html data.page.html}
</article>
