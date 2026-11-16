<script>
  import { base } from "$app/paths";
  import { SITE } from "$lib/content";

  let { lessons, editions, path } = $props();

  const links = [
    { slug: "case-study", title: "Case Study" },
    { slug: "readings", title: "Readings" },
    { slug: "resources", title: "Resources" },
  ];

  const link = (slug) => ({
    href: `${base}/${slug}`,
    "aria-current": path === `/${slug}` ? "page" : undefined,
  });
</script>

<nav class="mb-line md:sticky md:top-[var(--space)] md:mb-0 md:self-start">
  <a href="{base}/" class="mb-line block">{SITE}</a>

  <ol class="mb-line">
    {#each lessons as lesson}
      <li>
        <a {...link(lesson.slug)} class="flex gap-space">
          <span class="pt-[3px] text-small text-muted">{lesson.number}</span>
          <span>{lesson.title}</span>
        </a>
      </li>
    {/each}
  </ol>

  <ul class="mb-line">
    {#each links as { slug, title }}
      <li><a {...link(slug)}>{title}</a></li>
    {/each}
  </ul>

  {#if editions.length}
    <p class="text-muted">Editions</p>
    <ul class="mb-line">
      {#each editions as edition}
        <li><a {...link(edition.slug)}>{edition.title}</a></li>
      {/each}
    </ul>
  {/if}

  <a {...link("about")} aria-label="About">*</a>
</nav>
