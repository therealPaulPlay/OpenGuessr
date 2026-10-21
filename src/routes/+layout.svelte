<script>
	// This Layout applies to both the "game" and the "other" group, it is universal
	import "openguessr-ui/variables.css";
	import "openguessr-ui/base.css";
	import "openguessr-ui/classes.css";
	import "../app.css";
	import barlowFont from "openguessr-ui/fonts/barlow-condensed-medium.woff2";
	import Analytics from "$lib/components/Analytics.svelte";
	import { onNavigate } from "$app/navigation";

	let { children } = $props();

	// View transitions
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return; // Skip if the underlying page didn't change (e.g. goto("/") if already on "/")

		return new Promise((resolve) => {
			document.startViewTransition(async () => { // Takes first snapshot (old page)
				resolve();
				await navigation.complete; // Then new page gets built and awaited for the second snapshot (new page)
			});
		});
	});
</script>

{@render children?.()}

<!-- Google Analytics Component -->
<Analytics />

<!-- Site Global Scripts -->
<svelte:head>
	<link rel="preload" href={barlowFont} as="font" type="font/woff2" crossorigin="anonymous" />

	<!-- Turnstile Captcha -->
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
</svelte:head>
