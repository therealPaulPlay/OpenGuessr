<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { playMusic } from "$lib/utils/soundManager";
	import { singleplayer } from "$lib/stores/modeStore";
	import { multiplayerOverlay } from "$lib/stores/context-specific/multiplayerStore";
	import { inMenu } from "$lib/stores/uiStore";

	let musicStarted = $state(false);
	let startMusicTimeout;

	// Start music when the first round is started (tutorial open counts as in-menu too)
	// Slightly deferred to avoid interfering with panorama load if a different map was chosen
	$effect(() => {
		if (!$inMenu && !startMusicTimeout) startMusicTimeout = setTimeout(() => (musicStarted = true), 500);
	});

	// Adjust volume to screen
	$effect(() => {
		if (!musicStarted) return;
		if ($resultScreenEnabled || $inMenu || $multiplayerOverlay) playMusic("regular", 0.35);
		else $singleplayer ? playMusic("regular") : playMusic("intense");
	});
</script>
