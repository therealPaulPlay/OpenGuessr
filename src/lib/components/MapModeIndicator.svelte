<script>
	import { leaveFunction, mapModeIndicatorFading, timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { competition, countryGuessr, multiplayer, singleplayer } from "$lib/stores/modeStore";
	import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
	import { playSound } from "$lib/utils/soundManager";
	import { ArrowRightLeft, BookAlert, LogOut, Route, Target, Timer, TimerOff } from "@lucide/svelte";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { tooltip } from "$lib/utils/tooltip";
	import { goto } from "$app/navigation";
	import {
		currentRound,
		multiplayerMap,
		roundAmount,
		socket,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
	import { restrictionNames, selectedRestriction } from "$lib/stores/context-specific/restrictionStore";
	import { blur } from "svelte/transition";
	import { mapExpanded } from "$lib/stores/context-specific/mapStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";

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

{#if !$resultScreenEnabled && !$countryGuessr}
	<div
		class="barMenu map-mode-indicator"
		class:no-upper-rounded-corners={$mapExpanded}
		class:fading={Boolean($mapModeIndicatorFading)}
	>
		{#if $leaveFunction}
			<button
				class="standardButton"
				use:tooltip={{ text: "Leave" }}
				onclick={() => {
					playSound("leave_round");
					$leaveFunction?.();
				}}><LogOut size={22} strokeWidth={2} style="margin-top: 3px;" /></button
			>
		{/if}
		<div class="map-mode-text-container" style:margin-inline={$leaveFunction ? "3px" : "var(--panel-margin)"}>
			<p class="mode-text">
				{$singleplayer ? "Singleplayer" : $multiplayer ? "Multiplayer" : $competition ? "Competition" : "Unknown"}
			</p>
			<span class="info-tag">
				<p>
					<img class="map-icon" src="/img/maps_icon.png" alt="Maps" />{mapCategoryName}
				</p>
			</span>
			{#if currentRoundText != null}
				<span class="info-tag" transition:blur>
					<p>
						<Route size={16} strokeWidth={2.5} style="margin-right: 3px;" />{currentRoundText} / {roundAmountText}
					</p></span
				>
			{/if}
			{#if $selectedRestriction !== "standard"}
				<span class="info-tag" transition:blur>
					<p>
						<BookAlert size={16} strokeWidth={2.5} style="margin-right: 3px;" />{$restrictionNames[
							$selectedRestriction
						] || "Unknown"}
					</p></span
				>
			{/if}
		</div>
		<p
			id="map-timer"
			class="map-mode-text {$mapModeIndicatorFading ? 'fading' : ''}"
			style:opacity={$timerText ? "" : 0.5}
		>
			{#if $timerText}
				<Timer size={22} /> {$timerText}
			{:else}
				<TimerOff size={21} /> 00:00
			{/if}
		</p>
	</div>
{/if}

<style>
	.map-mode-indicator {
		pointer-events: auto;
		transition:
			width 250ms ease,
			border-radius 250ms ease,
			margin 250ms ease;
		z-index: 10;
		user-select: none;
		flex-shrink: 0;
		height: 40px;
		width: calc(100% - calc(var(--box-margin) + 6px));
		position: relative;
	}

	.no-upper-rounded-corners {
		border-top-right-radius: 0;
		border-top-left-radius: 0;
	}

	.map-icon {
		width: 20px;
		height: auto;
		margin-right: 3px;
		margin-bottom: -3px;
	}

	.info-tag {
		border-radius: 5px;
		background: var(--box-color);
		padding-inline: 5px;
		margin-left: 5px;
		box-shadow: var(--bulb-shadow);
		white-space: nowrap;
		display: inline-flex;
		min-width: fit-content;
		margin-bottom: -2px;
	}

	.info-tag p {
		opacity: 0.75;
		font-size: 20px;
	}

	:global(.mapModeIndicator.fading) {
		animation: divFade 1s infinite;
	}

	.map-mode-text-container {
		flex-grow: 1;
		display: inline-flex;
		gap: 5px;
		align-items: center;
		padding-top: 5px;
		padding-bottom: 5px;
		overflow: hidden;
		mask-image: linear-gradient(to right, black 90%, transparent);
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
		gap: 5px;
		margin-left: auto;
		margin-right: var(--panel-margin);
	}

	#map-timer.fading {
		animation: textFade 1s infinite;
	}
</style>
