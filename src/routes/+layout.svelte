<script>
    import Analytics from "$lib/components/Analytics.svelte";
    import { initializeAds } from "$lib/utils/ads";
    import { onMount } from "svelte";
    import "../app.css";

    let { children } = $props();

    onMount(() => {
        initializeAds();
    });
</script>

<svelte:head>
    <!-- Turnstile Captcha script -->
    <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        defer></script>
    <!-- Venatus ad script -->
    <script
        src="https://hb.vntsm.com/v4/live/vms/sites/openguessr.com/index.js"
        async></script>
</svelte:head>

{@render children?.()}

<!-- Google Analytics Component -->
<Analytics />
