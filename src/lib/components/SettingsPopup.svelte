<script>
	import Popup from "./ui/Popup.svelte";
	import { onMount, onDestroy } from "svelte";
	import { setSoundsVolume, playSound, setMusicVolume } from "$lib/utils/soundManager";
	import { preventFullscreen } from "$lib/stores/context-specific/platformSettingsStore";

	import { settingsPopup } from "$lib/stores/uiStore";
	import { InfoIcon, Scan } from "lucide-svelte";
	import Tabs from "./ui/Tabs.svelte";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";

	// Settings - Window ---------------------------------------------------------------------------------------
	function closeSettingsButton() {
		playSound("basic_button");
		settingsPopup.set(false);
	}

	// Unit switch between kilometers and miles ------------------
	let selectedUnit = $state("Metric");

	onMount(() => {
		const tempStorageDistanceUnit = localStorage.getItem("distanceUnit");
		if (tempStorageDistanceUnit != null) {
			selectedUnit = tempStorageDistanceUnit == "kilometers" ? "Metric" : "Imperial";
		}
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
		if (!document.fullscreenElement) {
			fullscreenButtonText = "Fullscreen";
		} else {
			fullscreenButtonText = "Exit Fullscreen";
		}
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
</script>

<svelte:document onfullscreenchange={fullscreenChangeCheck} />

{#if $settingsPopup}
	<Popup verySlim={true}>
		<div class="popup-title">
			<h1>Settings</h1>
		</div>
		<div class="settingsCanvas">
			<div class="settingsBox">
				<p class="textMargin">Unit system</p>
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
								false,
								false,
								false,
								true,
							);
						}}
					>
						<InfoIcon strokeWidth={2.5} size={18} />
					</button>
				</div>
			</div>
			{#if !$preventFullscreen}
				<div class="settingsBox">
					<p class="textMargin">View</p>
					<button id="fullscreenButton" class="standardButton white" onclick={toggleFullscreen}>
						<span class="fullscreenIcon">
							<Scan size="17" strokeWidth={3} />
						</span>
						<span id="fullscreenText">{fullscreenButtonText}</span>
					</button>
				</div>
			{/if}
			<div class="settingsBox">
				<p class="textMargin">Legal info</p>
				<button
					class="standardButton white"
					id="privacyButton"
					onclick={() => {
						playSound("basic_button");
						window.open("/legal", "_blank").focus();
					}}>Read</button
				>
			</div>
		</div>
		<button id="settingsClose" class="standardButton white closeButton" onclick={closeSettingsButton}>Close</button>
	</Popup>
{/if}

<style>
	.settingsBox {
		background-color: var(--box-color);
		border-radius: 10px;
		padding: var(--box-margin);
		overflow: hidden;
		flex-grow: 1;
		min-width: 150px;
		height: 77px;
	}

	.settingsCanvas {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		justify-content: flex-start;
		align-items: center;
		max-height: calc(100dvh - 250px);
		overflow-y: auto;
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
	}

	.sliderBox p {
		min-width: 45px;
		margin-left: 10px;
		opacity: 0.75;
	}

	.shortSlider {
		width: 175px;
	}

	.creditsButton {
		padding: 3px;
		padding-inline: 5px;
		display: flex;
		align-items: center;
		height: 30px;
	}
</style>
