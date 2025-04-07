<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { page } from "$app/state";
	import { playMusic } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { singleplayer } from "$lib/stores/modeStore";

	let siteLoaded = $state(false);
	let gameStart = $state(false);

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

	resultScreenEnabled.subscribe((value) => {
		if (value && !gameStart) setTimeout(() => (gameStart = true), 250); // Slight delay to ensure result map loads first
	});

	$effect(() => {
		if (!siteLoaded || !gameStart) return; // Load music after page has finished loading to not slow it down
		if ($resultScreenEnabled || page.url.pathname !== "/") {
			playMusic("regular", 0.35);
		} else {
			$singleplayer ? playMusic("regular") : playMusic("intense");
		}
	});
</script>
