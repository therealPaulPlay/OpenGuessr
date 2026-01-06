<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { page } from "$app/state";
	import { playMusic } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { singleplayer } from "$lib/stores/modeStore";
	import { multiplayerOverlay } from "$lib/stores/context-specific/multiplayerStore";

	let gameStart = $state(false);
	let gameStartTimeout;

	// Start music after first round
	resultScreenEnabled.subscribe((value) => {
		// Delayed to ensure result map loads first
		if (value && !gameStart && !gameStartTimeout) gameStartTimeout = setTimeout(() => (gameStart = true), 250);
	});

	// If player starts with multiplayer or competitions, start music
	singleplayer.subscribe((value) => {
		if (!value && !gameStart) gameStart = true;
	});

	$effect(() => {
		if (!gameStart) return; // Load music after game has started to not slow down load
		if ($resultScreenEnabled || page.url.pathname !== "/" || $multiplayerOverlay) {
			playMusic("regular", 0.35);
		} else {
			$singleplayer ? playMusic("regular") : playMusic("intense");
		}
	});
</script>
