<script>
	import Popup from "./ui/Popup.svelte";
	import { onMount, onDestroy } from "svelte";
	import { setSoundsVolume, playSound, setMusicVolume } from "$lib/utils/soundManager";
	import { preventFullscreen } from "$lib/stores/context-specific/platformSettingsStore";
	import { settingsPopup } from "$lib/stores/uiStore";
	import { InfoIcon, Scan, ChevronLeft, ChevronRight, Timer } from "@lucide/svelte";
	import Tabs from "./ui/Tabs.svelte";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { goto } from "$app/navigation";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { isSingleplayerNMPZ, singleplayerTimeout } from "$lib/stores/modeStore";
	import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";

	// Settings - Window ---------------------------------------------------------------------------------------
	function closeSettingsButton() {
		playSound("basic_button");
		settingsPopup.set(false);
	}

	// Unit switch between kilometers and miles ------------------
	let selectedUnit = $state("Metric");

	onMount(() => {
		const tempStorageDistanceUnit = localStorage.getItem("distanceUnit");
		if (tempStorageDistanceUnit != null) selectedUnit = tempStorageDistanceUnit == "kilometers" ? "Metric" : "Imperial";
	});

	// SFX Volume -----------------------------
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

	// Music Volume ----------------------------------------------------
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

	const fullscreenChangeCheck = function () {
		if (!document.fullscreenElement) fullscreenButtonText = "Fullscreen";
		else fullscreenButtonText = "Exit";
	};

	function toggleFullscreen() {
		playSound("basic_button");

		try {
			if (!document.fullscreenElement) {
				if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
			} else {
				if (document.exitFullscreen) document.exitFullscreen();
			}
		} catch (error) {
			console.error("Error entering / exiting fullscreen: " + error);
		}
	}

	// Singleplayer timer ---------------------------------------------------------
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

	// Find the corresponding slider value for the current timeout value
	$effect(() => {
		const timerSetting = timerValues.find((t) => Math.abs(t.actual - ($singleplayerTimeout || 0)) < 0.01);
		timerSliderValue = timerSetting?.slider ?? 0;
	});

	let changeRegenerationTimeout;

	function changeTimeout() {
		const timerSetting = timerValues.find((t) => t.slider === timerSliderValue);
		$singleplayerTimeout = timerSetting ? timerSetting.actual : 0;
		localStorage.setItem("singleplayerTimer", $singleplayerTimeout);
		clearTimeout(changeRegenerationTimeout);
		changeRegenerationTimeout = setTimeout(checkGenerationTypeAndGenerate, 250);
	}

	// Toggle NMPZ ------------------------------------------------------------------
	function toggleSingleplayerNMPZ() {
		playSound("basic_button");
		$isSingleplayerNMPZ = !$isSingleplayerNMPZ;
		localStorage.setItem("singleplayerNMPZ", $isSingleplayerNMPZ ? "true" : "");
		checkGenerationTypeAndGenerate();
	}
</script>

<svelte:document onfullscreenchange={fullscreenChangeCheck} />

<Popup verySlim={true} bind:open={$settingsPopup}>
	<div class="popup-title">
		<h1>Settings</h1>
	</div>
	<div class="settingsCanvas">
		<TitleSeparator text="Singleplayer" noMargin={true} />
		<div class="settingsCanvas slightBottomMargin">
			<div class="settingsBox settingsBoxFlex">
				<div class="timerTextBox">
					<Timer />
					<p id="timerSliderText" contenteditable="false">{timerSliderText}</p>
				</div>
				<div class="timerControlsWrapper">
					<button class="arrowButton standardButton white" onclick={() => adjustTimer(false)}>
						<ChevronLeft size={20} strokeWidth={2.5} />
					</button>

					<input
						type="range"
						min="0"
						max="121"
						step="1"
						class="slider timerSlider"
						onchange={changeTimeout}
						bind:value={timerSliderValue}
					/>

					<button class="arrowButton standardButton white" onclick={() => adjustTimer(true)}>
						<ChevronRight size={20} strokeWidth={2.5} />
					</button>
				</div>
			</div>
			<div class="settingsBox settingsBoxFlex noFlexWrap">
				<p class="settingsBoxFlexTitle">No Move, Pan or Zoom (NMPZ)</p>
				<button class="standardButton white" onclick={toggleSingleplayerNMPZ}
					>{$isSingleplayerNMPZ ? "Enabled" : "Disabled"}</button
				>
			</div>
			<TitleSeparator text="Audio" noMargin={true} />
			<div class="settingsBox">
				<p class="textMargin">SFX volume</p>
				<div class="sliderBox">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						class="slider shortSlider"
						bind:value={sfxVolumeSliderValue}
						style:background={sfxSliderBg}
						oninput={inputSFXVolumeSlider}
					/>
					<p>{sfxSliderBgPercentage}%</p>
				</div>
			</div>
			<div class="settingsBox">
				<p class="textMargin">Music volume</p>
				<div class="sliderBox">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						class="slider shortSlider"
						bind:value={musicVolumeSliderValue}
						style:background={musicSliderBg}
						oninput={inputMusicVolumeSlider}
					/>
					<p>{musicSliderBgPercentage}%</p>
					<button
						class="standardButton white creditsButton"
						onclick={() => {
							playSound("basic_button");
							showConfirmPopup(
								"Credits",
								'The music was composed by Lazy Bugatti. Check out his Spotify account "QGM" :-)',
							);
						}}
					>
						<InfoIcon strokeWidth={2.5} size={18} />
					</button>
				</div>
			</div>
			<TitleSeparator text="General" noMargin={true} />
			<div class="settingsBox settingsBoxFlex">
				<p class="settingsBoxFlexTitle">Unit system</p>
				<Tabs
					tabs={["Metric", "Imperial"]}
					class="settingsNoButtonMargin"
					bind:selected={selectedUnit}
					onchange={(tab) => {
						playSound("basic_button");
						localStorage.setItem("distanceUnit", tab == "Metric" ? "kilometers" : "miles");
					}}
				/>
			</div>
			{#if !$preventFullscreen}
				<div class="settingsBox settingsBoxFlex">
					<p class="settingsBoxFlexTitle">View</p>
					<button id="fullscreenButton" class="standardButton white" onclick={toggleFullscreen}>
						<span class="fullscreenIcon">
							<Scan size="17" strokeWidth={3} />
						</span>
						<span id="fullscreenText">{fullscreenButtonText}</span>
					</button>
				</div>
			{/if}
			<div class="settingsBox settingsBoxFlex">
				<p class="settingsBoxFlexTitle">Legal info</p>
				<button
					class="standardButton white"
					id="privacyButton"
					onclick={() => {
						playSound("basic_button");
						goto("/legal");
						$settingsPopup = false;
					}}>Read</button
				>
			</div>
		</div>
	</div></Popup
>

<style>
	.settingsBox {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		overflow: hidden;
		flex-grow: 1;
		min-width: 150px;
		height: 77px;
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

	.timerTextBox {
		border: 5px;
		display: flex;
		justify-content: space-between;
		box-shadow: var(--box-shadow);
		align-items: center;
		gap: 5px;
		height: 31px;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 5px;
		padding-inline: 10px;
		border-radius: 5px;
		min-width: 125px;
		text-align: center;
	}

	.settingsBoxFlex {
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		height: unset;
		flex-wrap: wrap;
	}

	.timerSlider {
		flex-grow: 1;
	}

	.settingsBoxFlexTitle {
		margin-left: var(--panel-margin);
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.settingsCanvas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		width: 100%;
		justify-content: flex-start;
		align-items: center;
	}

	.textMargin {
		margin-inline: 5px;
		margin-bottom: 10px;
	}

	.fullscreenIcon {
		margin-right: 3px;
	}

	.sliderBox {
		display: flex;
		margin-top: 18px;
		margin-left: 5px;
		align-items: center;
		justify-content: space-between;
	}

	.sliderBox p {
		min-width: 45px;
		margin-left: 10px;
		opacity: 0.75;
	}

	.shortSlider {
		width: 150px;
	}

	.noFlexWrap {
		flex-wrap: nowrap;
	}

	.creditsButton {
		padding: 3px;
		padding-inline: 6px;
		display: flex;
		align-items: center;
		height: 30px;
	}
</style>
