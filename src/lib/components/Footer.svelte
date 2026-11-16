<script>
  import { CREDITS } from "$lib/content";
</script>

<footer class="bg-pink mt-8 px-4 py-2 text-sm">
  <div>
    {#each CREDITS as { lines, href }}
      <p>
        {#if href}
          <a {href} target="_blank" rel="noopener"
            >{@html lines.join("<br />")}</a
          >
        {:else}
          {@html lines.join("<br />")}
        {/if}
      </p>
    {/each}
  </div>
</footer>
