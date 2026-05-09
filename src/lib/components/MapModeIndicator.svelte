<script>
	import { mapModeIndicatorFading, timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { competition, countryGuessr, multiplayer, singleplayer } from "$lib/stores/modeStore";
	import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
	import { BookAlert, Route, Timer } from "@lucide/svelte";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { currentRound, multiplayerMap, roundAmount } from "$lib/stores/context-specific/multiplayerStore";
	import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
	import { restrictionNames, selectedRestriction } from "$lib/stores/context-specific/restrictionStore";
	import { blur, slide } from "svelte/transition";
	import { mapExpanded } from "$lib/stores/context-specific/mapStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
	import Chip from "./ui/Chip.svelte";

	let mapCategoryName = $state("Loading...");

	$effect(() => {
		if ($currentLocationLatitude && $currentLocationLongitude) {
			if ($singleplayer) mapCategoryName = idToMapName(localStorage.getItem("selectedMap") || $defaultMap);
			if ($multiplayer) mapCategoryName = idToMapName($multiplayerMap);
			if ($competition) mapCategoryName = $competitionData?.name;
		}
	});

	let currentRoundText = $derived.by(() => {
		if ($singleplayer) return null;
		if ($multiplayer) return $currentRound;
		if ($competition) return $competitionRound;
	});

	let roundAmountText = $derived.by(() => {
		if ($singleplayer) return null;
		if ($multiplayer) return $roundAmount;
		if ($competition) return $competitionData?.roundAmount;
	});
</script>

{#if !$resultScreenEnabled && !$countryGuessr && $mapExpanded}
	<div
		class="barMenu map-mode-indicator"
		class:fading={Boolean($mapModeIndicatorFading)}
		transition:slide={{ axis: "y", duration: $resultScreenEnabled ? 0 : 150 }}
	>
		<div class="map-mode-text-container of-left of-right">
			<p>
				{$singleplayer ? "Singleplayer" : $multiplayer ? "Multiplayer" : $competition ? "Competition" : "Unknown"}
			</p>
			<Chip class="info-tag">
				<img class="map-icon" src="/img/maps_icon.png" alt="Maps" />{mapCategoryName}
			</Chip>
			{#if currentRoundText != null}
				<Chip class="info-tag">
					<Route size={16} strokeWidth={2.5} style="margin-right: 3px;" />{currentRoundText} / {roundAmountText}
				</Chip>
			{/if}
			{#if $selectedRestriction !== "standard"}
				<Chip class="info-tag">
					<BookAlert size={16} strokeWidth={2.5} style="margin-right: 3px;" />{$restrictionNames[
						$selectedRestriction
					] || "Unknown"}
				</Chip>
			{/if}
		</div>
		{#if $timerText}
			<p id="map-timer" class="map-mode-text {$mapModeIndicatorFading ? 'fading' : ''}" transition:blur>
				<Timer size={22} />
				{$timerText || "00:00"}
			</p>
		{/if}
	</div>
{/if}

<style>
	.map-mode-indicator {
		pointer-events: auto;
		transition:
			width 250ms ease,
			border-radius 250ms ease,
			margin 250ms ease;
		z-index: 1;
		user-select: none;
		flex-shrink: 0;
		height: 56px;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		border-top-right-radius: 0;
		border-top-left-radius: 0;
	}

	.map-icon {
		width: 20px;
		height: 20px;
		margin-right: 3px;
		margin-bottom: -0.5px;
	}

	:global(.info-tag) {
		margin-left: var(--content-margin);
		margin-bottom: -2px;
	}

	:global(.mapModeIndicator.fading) {
		animation: divFade 1s infinite;
	}

	.map-mode-text-container {
		flex-grow: 1;
		margin-inline: var(--panel-margin);
		display: inline-flex;
		gap: var(--content-margin);
		align-items: center;
		padding-top: var(--content-margin);
		padding-bottom: var(--content-margin);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.map-mode-text-container p {
		white-space: nowrap;
	}

	.map-mode-text {
		width: fit-content;
	}

	@keyframes divFade {
		0% {
			background-color: var(--panel-color);
		}
		50% {
			background-color: hsla(298, 25%, 20%, 0.7);
		}
		100% {
			background-color: var(--panel-color);
		}
	}

	@keyframes textFade {
		0% {
			color: white;
		}
		50% {
			color: red;
		}
		100% {
			color: white;
		}
	}

	#map-timer {
		text-align: right;
		min-width: fit-content;
		display: flex;
		align-items: center;
		gap: var(--content-margin);
		margin-left: auto;
		margin-right: var(--panel-margin);
		font-variant-numeric: tabular-nums;
	}

	#map-timer.fading {
		animation: textFade 1s infinite;
	}
</style>
