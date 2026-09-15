<script>
	import Popup from "./ui/Popup.svelte";
	import { onMount } from "svelte";
	import { setSoundsVolume, playSound, setMusicVolume } from "$lib/utils/soundManager";
	import { preventFullscreen } from "$lib/stores/context-specific/platformSettingsStore";
	import { settingsPopup } from "$lib/stores/uiStore";
	import { InfoIcon, Scan, ChevronLeft, ChevronRight, Timer } from "@lucide/svelte";
	import Tabs from "./ui/Tabs.svelte";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { singleplayer } from "$lib/stores/modeStore";
	import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
	import { setRestriction } from "$lib/utils/setRestriction";

	// Unit switch between kilometers and miles -------------------------------------------
	let selectedUnit = $state("Metric");

	onMount(() => {
		const tempStorageDistanceUnit = localStorage.getItem("distanceUnit");
		if (tempStorageDistanceUnit !== null) {
			selectedUnit = tempStorageDistanceUnit == "kilometers" ? "Metric" : "Imperial";
		}
	});

	// SFX Volume ----------------------------------------------------------------------------
	let sfxVolumeSliderValue = $state(0.5);
	let sfxSliderBgPercentage = $state(100);

	function inputSFXVolumeSlider() {
		setSoundsVolume(sfxVolumeSliderValue);
		sfxSliderBgPercentage = Math.round(sfxVolumeSliderValue * 100);
	}

	onMount(() => {
		const savedSoundVolume = localStorage.getItem("soundVolume") ? localStorage.getItem("soundVolume") : 0.5;
		setSoundsVolume(savedSoundVolume);
		sfxVolumeSliderValue = savedSoundVolume;
		sfxSliderBgPercentage = Math.round(sfxVolumeSliderValue * 100);
	});

	let sfxSliderBg = $derived(
		`linear-gradient(to right, var(--brand-color) 0%, var(--brand-color) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) 100%)`,
	);

	// Music Volume -------------------------------------------------------------------------
	let musicVolumeSliderValue = $state(0.5);
	let musicSliderBgPercentage = $state(100);

	function inputMusicVolumeSlider() {
		setMusicVolume(musicVolumeSliderValue);
		musicSliderBgPercentage = Math.round(musicVolumeSliderValue * 100);
	}

	onMount(() => {
		const savedMusicVolume = localStorage.getItem("musicVolume") ? localStorage.getItem("musicVolume") : 0.5;
		setMusicVolume(parseFloat(savedMusicVolume));
		musicVolumeSliderValue = savedMusicVolume;
		musicSliderBgPercentage = Math.round(musicVolumeSliderValue * 100);
	});

	let musicSliderBg = $derived(
		`linear-gradient(to right, var(--brand-color) 0%, var(--brand-color) ${musicSliderBgPercentage}%, rgba(255, 255, 255, 0.1) ${musicSliderBgPercentage}%, rgba(255, 255, 255, 0.1) 100%)`,
	);

	// Fullscreen Setting ----------------------------------------------------
	let fullscreenButtonText = $state("Fullscreen");

	const adjustFullscreenButtonText = function () {
		if (!document.fullscreenElement) fullscreenButtonText = "Fullscreen";
		else fullscreenButtonText = "Exit";
	};

	function toggleFullscreen() {
		try {
			playSound("basic_button");
			if (!document.fullscreenElement) document.documentElement?.requestFullscreen();
			else document?.exitFullscreen();
		} catch (error) {
			console.error("Error entering or exiting fullscreen: " + error);
		}
	}

	// Singleplayer timer -----------------------------------------------------------------
	let timerSliderValue = $state(0);

	// Timer values dictionary
	const timerValues = [
		{ slider: 0, actual: 0, text: "No timer" },
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

	let singleplayerTimeout = $state(0);

	onMount(() => {
		singleplayerTimeout = Number(localStorage.getItem("singleplayerTimer")) || 0;
	});

	// Find the corresponding slider value for the current timeout value
	$effect(() => {
		const timerSetting = timerValues.find((t) => Math.abs(t.actual - (singleplayerTimeout || 0)) < 0.01);
		timerSliderValue = timerSetting?.slider ?? 0;
	});

	let changeRegenerationTimeout;

	function changeTimeout() {
		const timerSetting = timerValues.find((t) => t.slider === timerSliderValue);
		singleplayerTimeout = timerSetting ? timerSetting.actual : 0;
		localStorage.setItem("singleplayerTimer", singleplayerTimeout);
		clearTimeout(changeRegenerationTimeout);
		changeRegenerationTimeout = setTimeout(checkGenerationTypeAndGenerate, 250);
	}

	// Toggle NMPZ ------------------------------------------------------------------
	let singleplayerNMPZ = $state(false);
	let selectedNMPZ = $derived(singleplayerNMPZ ? "On" : "Off");

	onMount(() => {
		singleplayerNMPZ = Boolean(localStorage.getItem("singleplayerNMPZ"));
	});

	function setSingleplayerNMPZ(selected) {
		playSound("basic_button");
		singleplayerNMPZ = selected === "On";
		localStorage.setItem("singleplayerNMPZ", singleplayerNMPZ ? "true" : "");
		singleplayerNMPZ ? setRestriction("nmpz") : setRestriction();
	}
</script>

<svelte:document onfullscreenchange={adjustFullscreenButtonText} />

<Popup verySlim={true} bind:open={$settingsPopup}>
	<div class="popup-title">
		<h1>Settings</h1>
	</div>
	<div class="settings-canvas">
		<TitleSeparator text="Singleplayer" noMargin={true} />
		<div class="settings-box settings-box-flex" class:box-disabled={!$singleplayer}>
			<div class="timer-text-box white-soft">
				<Timer />
				<p id="timer-slider-text" contenteditable="false">{timerSliderText}</p>
			</div>
			<div class="timer-controls-wrapper">
				<button class="arrow-button standard-button white" onclick={() => adjustTimer(false)}>
					<ChevronLeft size={20} strokeWidth={2.5} />
				</button>

				<input
					type="range"
					min="0"
					max="121"
					step="1"
					class="slider timer-slider"
					onchange={changeTimeout}
					bind:value={timerSliderValue}
				/>

				<button class="arrow-button standard-button white" onclick={() => adjustTimer(true)}>
					<ChevronRight size={20} strokeWidth={2.5} />
				</button>
			</div>
		</div>
		<div class="settings-box settings-box-flex no-flex-wrap" class:box-disabled={!$singleplayer}>
			<p class="settings-box-flex-title">No Move, Pan or Zoom</p>
			<Tabs tabs={["On", "Off"]} selected={selectedNMPZ} onchange={(selected) => setSingleplayerNMPZ(selected)}
			></Tabs>
		</div>
		<TitleSeparator text="Audio" noMargin={true} />
		<div class="settings-box">
			<p class="text-margin">SFX volume</p>
			<div class="slider-box">
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					class="slider short-slider"
					bind:value={sfxVolumeSliderValue}
					style:background={sfxSliderBg}
					oninput={inputSFXVolumeSlider}
				/>
				<p style:margin-right="auto">{sfxSliderBgPercentage}%</p>
			</div>
		</div>
		<div class="settings-box">
			<p class="text-margin">Music volume</p>
			<div class="slider-box">
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					class="slider short-slider"
					bind:value={musicVolumeSliderValue}
					style:background={musicSliderBg}
					oninput={inputMusicVolumeSlider}
				/>
				<p style:margin-right="auto">{musicSliderBgPercentage}%</p>
				<button
					class="standard-button white credits-button"
					onclick={() => {
						playSound("basic_button");
						showConfirmPopup("Credits", 'The music was composed by Lazy Bugatti. Check out his Spotify account "QGM"!');
					}}
				>
					<InfoIcon strokeWidth={2.5} size={18} />
				</button>
			</div>
		</div>
		<TitleSeparator text="General" noMargin={true} />
		<div class="settings-box settings-box-flex">
			<p class="settings-box-flex-title">Unit system</p>
			<Tabs
				tabs={["Metric", "Imperial"]}
				class="settings-no-button-margin"
				bind:selected={selectedUnit}
				onchange={(tab) => {
					playSound("basic_button");
					localStorage.setItem("distanceUnit", tab == "Metric" ? "kilometers" : "miles");
				}}
			/>
		</div>
		{#if !$preventFullscreen}
			<div class="settings-box settings-box-flex">
				<p class="settings-box-flex-title">View</p>
				<button id="fullscreen-button" class="standard-button white" onclick={toggleFullscreen}>
					<span class="fullscreen-icon">
						<Scan size="17" strokeWidth={3} style="margin-bottom: -1px;" />
					</span>
					<span id="fullscreen-text">{fullscreenButtonText}</span>
				</button>
			</div>
		{/if}
	</div>
</Popup>

<style>
	.settings-box {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		overflow: hidden;
		flex-grow: 1;
		min-width: 150px;
		height: 77px;
	}

	.timer-controls-wrapper {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		width: fit-content;
		flex-basis: 45%;
		flex-grow: 1;
	}

	.box-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.arrow-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--content-margin);
	}

	.timer-text-box {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--box-shadow);
		align-items: center;
		gap: var(--content-margin);
		height: 31px;
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		border-radius: var(--content-margin);
		min-width: 125px;
		text-align: center;
	}

	.settings-box-flex {
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		height: unset;
		flex-wrap: wrap;
	}

	.timer-slider {
		flex-grow: 1;
	}

	.settings-box-flex-title {
		margin-left: var(--content-margin);
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.settings-canvas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		width: 100%;
		justify-content: flex-start;
		align-items: center;
	}

	.text-margin {
		margin-inline: var(--content-margin);
		margin-bottom: var(--box-margin);
	}

	.fullscreen-icon {
		margin-right: 3px;
	}

	.slider-box {
		display: flex;
		margin-top: 18px;
		margin-left: var(--content-margin);
		align-items: center;
		gap: var(--content-margin);
		justify-content: space-between;
	}

	.slider-box p {
		min-width: 45px;
		margin-left: var(--box-margin);
		opacity: 0.75;
	}

	.short-slider {
		width: 150px;
	}

	.no-flex-wrap {
		flex-wrap: nowrap;
	}

	.credits-button {
		padding: 3px;
		padding-inline: 6px;
		display: flex;
		align-items: center;
		height: 30px;
	}
</style>
