<script>
  // This Layout applies to both the "game" and the "other" group, it is universal
  import "../app.css";
  import Analytics from "$lib/components/Analytics.svelte";

  let { children } = $props();
</script>

{@render children?.()}

<!-- Google Analytics Component -->
<Analytics />

<!-- Site Global Scripts -->
<svelte:head>
  <!-- Turnstile Captcha -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
</svelte:head>
