<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { page } from "$app/state";
	import { playMusic } from "$lib/utils/soundManager";
	import { singleplayer } from "$lib/stores/modeStore";
	import { onMount } from "svelte";

	let siteLoaded = $state(false);

	onMount(() => {
		if (document.readyState === "complete") {
			siteLoaded = true;
		} else {
			// Wait for the load event if still loading
			window.addEventListener("load", () => {
				siteLoaded = true;
			});
		}
	});

	$effect(() => {
		if (!siteLoaded) return; // Load music after page has finished loading to not slow it down
		if ($resultScreenEnabled || page.url.pathname !== "/") {
			playMusic("chill");
		} else {
			$singleplayer ? playMusic("regular") : playMusic("intense");
		}
	});
</script>
