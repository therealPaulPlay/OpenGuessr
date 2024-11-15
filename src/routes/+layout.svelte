<script>
    // This Layout applies to both the "game" and the "other" group, it is universal
      import "../app.css";
      import Analytics from "$lib/components/Analytics.svelte";

      let { children } = $props();
</script>

{@render children?.()}

<!-- Google Analytics Component -->
<Analytics />