<script>
  import "../app.css";
  import { page } from "$app/state";
  import { base } from "$app/paths";
  import { dither } from "$lib/dither";
  import Wires from "$lib/components/Wires.svelte";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { data, children } = $props();

  const path = $derived(page.url.pathname.replace(base, "") || "/");
</script>

<div class="min-h-screen bg-paper font-sans text-ink">
  {#if path === "/"}<Wires />{/if}
  <div class="grid p-space md:page-grid min-h-[90dvh]">
    <Nav lessons={data.lessons} editions={data.editions} {path} />
    <main use:dither>
      {@render children()}
    </main>
  </div>
  <Footer />
</div>
