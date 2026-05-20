<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { page } from "$app/state";
	import { playMusic } from "$lib/utils/soundManager";
	import { singleplayer, tutorial } from "$lib/stores/modeStore";
	import { multiplayerOverlay } from "$lib/stores/context-specific/multiplayerStore";
	import { tutorialStep } from "$lib/stores/uiStore";

	let musicStarted = $state(false);
	let startMusicTimeout;

	// Start music after first round, with slight delay to avoid impacting result map load speed
	resultScreenEnabled.subscribe((value) => {
		if (value && !musicStarted && !startMusicTimeout) startMusicTimeout = setTimeout(() => (musicStarted = true), 250);
	});

	// Start music when the first tutorial round starts (tutorial active, but tutorial overlay hidden since step is zero)
	tutorialStep.subscribe((value) => {
		if (value == 0 && $tutorial && !musicStarted && !startMusicTimeout) musicStarted = true;
	});

	// If player starts with multiplayer or competitions, start music
	singleplayer.subscribe((value) => {
		if (!value && !musicStarted) musicStarted = true;
	});

	// Adjust volume to screen
	$effect(() => {
		if (!musicStarted) return;
		if ($resultScreenEnabled || page.url.pathname !== "/" || $multiplayerOverlay || $tutorialStep !== 0) {
			playMusic("regular", 0.35);
		} else {
			$singleplayer ? playMusic("regular") : playMusic("intense");
		}
	});
</script>
