<script>
	// This Layout applies to both the "game" and the "other" group, it is universal
	import "../app.css";
	import Analytics from "$lib/components/Analytics.svelte";
	import { onNavigate } from "$app/navigation";

	let { children } = $props();

	// View transitions
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

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
	<!-- Turnstile Captcha -->
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
</svelte:head>
