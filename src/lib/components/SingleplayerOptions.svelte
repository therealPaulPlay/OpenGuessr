<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
	import { playSound } from "$lib/utils/soundManager";
	import { openLocationOnMaps } from "$lib/utils/openLocationOnMaps";
	import { formatDistance } from "$lib/utils/distanceFunctions";
	import { singleplayerOptionsPopup } from "$lib/stores/uiStore";
	import { isSingleplayerNMPZ, singleplayerTimeout } from "$lib/stores/modeStore";
	import { roundLog } from "$lib/stores/locationStore";
	import { onMount } from "svelte";
	import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-svelte";
	import { crazyGames, playlightSDK } from "$lib/stores/context-specific/platformSettingsStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";

	// Singleplayer Options UI ----------------------------------------------------------------------------------------
	let timerSliderValue = $state(0);

	// Timer values dictionary
	const timerValues = [
		{ slider: 0, actual: 0, text: "No Timer" },
		{ slider: 1, actual: 0.1, text: "One blink" },
	];
	try {
		for (let i = 1; i <= 120; i++) {
			timerValues.push({ slider: i + 1, actual: i, text: `${i} Seconds` });
		}
	} catch (error) {
		console.error("Error filling up timer value array:", error);
	}

	// Get display text based on slider value
	let timerSliderText = $derived(timerValues.find((t) => t?.slider === timerSliderValue)?.text);

	// Increase or decrease the timer value by one step
	function adjustTimer(increment) {
		playSound("basic_button");
		const newValue = timerSliderValue + (increment ? 1 : -1);
		if (newValue >= 0 && newValue <= 121) {
			timerSliderValue = newValue;
			changeTimeout();
		}
	}

	// Timer Slider ---------------------------------------------------------------------------------------------------------------------------
	let changeRegenerationTimeout;
	
	function changeTimeout() {
		const timerSetting = timerValues.find((t) => t.slider === timerSliderValue);
		$singleplayerTimeout = timerSetting ? timerSetting.actual : 0;
		localStorage.setItem("singleplayerTimer", $singleplayerTimeout);
		clearTimeout(changeRegenerationTimeout);
		changeRegenerationTimeout = setTimeout(checkGenerationTypeAndGenerate, 250);
	}

	// Toggle Singleplayer Restrictions -----------------------------------------------------------------------------------

	onMount(() => {
		$isSingleplayerNMPZ = localStorage.getItem("singleplayerNMPZ")
			? Boolean(localStorage.getItem("singleplayerNMPZ"))
			: false;
	});

	function toggleSingleplayerNMPZ() {
		playSound("basic_button");
		$isSingleplayerNMPZ = !$isSingleplayerNMPZ;
		localStorage.setItem("singleplayerNMPZ", $isSingleplayerNMPZ ? "true" : "");

		checkGenerationTypeAndGenerate();
	}

	// Apply singleplayer settings ----------------------------------------------------------------------------------
	onMount(() => {
		const savedTimer =
			localStorage.getItem("singleplayerTimer") != null ? Number(localStorage.getItem("singleplayerTimer")) : 0;

		// Find the corresponding slider value for the saved actual timer value
		const timerSetting = timerValues.find((t) => Math.abs(t.actual - savedTimer) < 0.01);
		$singleplayerTimeout = timerSetting?.actual ?? 0;
	});

	$effect(() => {
		// Find the corresponding slider value for the current timeout value
		const timerSetting = timerValues.find((t) => Math.abs(t.actual - ($singleplayerTimeout || 0)) < 0.01);
		timerSliderValue = timerSetting?.slider ?? 0;
	});

	// Round Log ---------------------------------------------------------------------------------------------------------------
	onMount(() => {
		try {
			roundLog.set(JSON.parse(localStorage.getItem("roundLog")) || []);
		} catch (error) {
			console.error("Error parsing roundLog JSON:", error);
		}
	});
</script>

{#if $singleplayerOptionsPopup}
	<Popup verySlim={true}>
		<div class="popup-title">
			<h1>Game options</h1>
		</div>
		<div class="settingsScrollArea">
			{#if !$crazyGames}
				<div class="settingsCanvas slightBottomMargin">
					<div class="playlight-pitch">
						<p class="game-pitch-text">Looking for other exciting games?</p>
						<button
							class="standardButton white game-pitch-button"
							onclick={() => {
								playSound("basic_button");
								$playlightSDK?.setDiscovery();
							}}>Discover <Gamepad2 style="margin-bottom: -5px; margin-left: 2px;" /></button
						>
					</div>
				</div>
			{/if}
			<TitleSeparator text="Timer" />
			<div class="settingsCanvas slightBottomMargin">
				<div class="optionFlexBox">
					<div class="timerControlsWrapper">
						<button class="arrowButton standardButton white" onclick={() => adjustTimer(false)}>
							<ChevronLeft size={20} strokeWidth={2.5} />
						</button>

						<input
							type="range"
							min="0"
							max="121"
							step="1"
							class="slider"
							id="timerSlider"
							onchange={changeTimeout}
							bind:value={timerSliderValue}
						/>

						<button class="arrowButton standardButton white" onclick={() => adjustTimer(true)}>
							<ChevronRight size={20} strokeWidth={2.5} />
						</button>
					</div>

					<div class="timerTextBox">
						<img alt="timer icon" class="timerIcon" src="/img/timer_icon.png" />
						<p id="timerSliderText" contenteditable="false">{timerSliderText}</p>
					</div>
				</div>
			</div>
			<TitleSeparator text="NMPZ" />
			<div class="settingsCanvas slightBottomMargin">
				<div class="optionFlexBox">
					<p class="singleplayerDesc textMarginInline">Prevent Move, Pan and Zoom.</p>
					<button id="setSingleplayerNMPZ" class="standardButton white" onclick={toggleSingleplayerNMPZ}
						>{$isSingleplayerNMPZ ? "Enabled" : "Disabled"}</button
					>
				</div>
			</div>
			<TitleSeparator text="Round log" />
			<div class="settingsCanvas slightBottomMargin">
				<div class="optionBox roundLogContainer">
					<div class="roundLogBox" id="roundLogBox">
						<!-- round log will be automatically generated here -->
						{#if $roundLog.length > 0}
							{#each $roundLog as [mode, distance, coordinates], index}
								<div class="roundLogItem">
									<div>
										<p class="logItemMode">{mode}</p>
										<p>{formatDistance(distance)} away</p>
									</div>
									<button
										class="standardButton white"
										onclick={() => {
											playSound("basic_button");
											openLocationOnMaps(coordinates[0], coordinates[1]);
										}}
									>
										View
									</button>
								</div>
							{/each}
						{:else}
							<p class="centerLogText">No saved rounds.</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<button
			id="singleplayerOptionsClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				$singleplayerOptionsPopup = false;
			}}>Close</button
		>
	</Popup>
{/if}

<div style="display: none;">
	<!-- Ensure this component is always mounted, so that the logic inside loads -->
</div>

<style>
	.settingsCanvas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--box-margin);
		justify-content: flex-start;
		align-items: center;
	}

	.optionBox {
		background-color: var(--box-color);
		border-radius: 10px;
		padding: var(--box-margin-buttons);
		overflow: hidden;
		flex-grow: 1;
		min-width: 150px;
	}

	.optionFlexBox {
		display: flex;
		gap: var(--box-margin-buttons);
		padding: var(--box-margin-buttons);
		background-color: var(--box-color);
		min-width: 150px;
		flex-grow: 1;
		border-radius: 10px;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
	}

	#timerSlider {
		min-width: 80px;
		flex-grow: 1;
	}

	.playlight-pitch {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		gap: var(--box-margin);
		padding: var(--box-margin-buttons);
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		flex-wrap: wrap;
	}

	.game-pitch-text {
		margin-left: 5px;
		text-wrap: nowrap;
		flex-grow: 20;
	}

	.game-pitch-button {
		flex-grow: 1;
	}

	.timerControlsWrapper {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		width: fit-content;
		flex-basis: 60%;
		flex-grow: 1;
	}

	.arrowButton {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px;
	}

	.settingsScrollArea {
		max-height: calc(100dvh - 250px);
		width: 100%;
		overflow: hidden;
		overflow-y: auto;
	}

	.textMarginInline {
		margin-inline: 5px;
	}

	.timerTextBox {
		border: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 5px;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 5px;
		padding-inline: 10px;
		border-radius: 5px;
		min-width: 130px;
		text-align: center;
		margin-bottom: auto;
		margin-top: auto;
		margin-right: 2px;
	}

	.singleplayerDesc {
		opacity: 0.5;
	}

	.roundLogBox {
		display: flex;
		align-items: center;
		justify-content: safe center;
		gap: var(--box-margin);
		flex-direction: column;
		overflow-y: auto;
		max-height: 170px;
		padding-bottom: 0;
		scrollbar-width: none;
	}

	.logItemMode {
		font-size: 20px;
		opacity: 50%;
	}

	.roundLogContainer {
		height: fit-content;
		padding: var(--box-margin);
	}

	.centerLogText {
		text-align: center;
		width: 100%;
		opacity: 50%;
		font-size: 22px;
	}

	.roundLogItem {
		background-color: var(--box-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--box-margin);
		padding-inline: 15px;
		border-radius: 5px;
		width: calc(100% - 30px);
	}

	.timerIcon {
		width: 23px;
		height: 23px;
		opacity: 0.5;
	}
</style>
