<script>
	import Popup from "./ui/Popup.svelte";
	import { onMount, onDestroy } from "svelte";
	import { setSoundsVolume, playSound } from "$lib/utils/soundManager";
	import { preventFullscreen, preventExitPopup } from "$lib/stores/context-specific/platformSettingsStore";

	import { settingsPopup } from "$lib/stores/uiStore";
	import { Scan } from "lucide-svelte";
	import Tabs from "./ui/Tabs.svelte";

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

	function inputSFXVolumeSlider() {
		setSoundsVolume(sfxVolumeSliderValue);
		updateSliderBackground();
	}

	let sfxSliderBgPercentage = $state(100);

	function updateSliderBackground() {
		sfxSliderBgPercentage = sfxVolumeSliderValue * 100;
	}

	onMount(() => {
		let tempLocalstorageSoundVolume = localStorage.getItem("soundVolume") ? localStorage.getItem("soundVolume") : 0.5;
		setSoundsVolume(tempLocalstorageSoundVolume);
		sfxVolumeSliderValue = tempLocalstorageSoundVolume;
		updateSliderBackground();
	});

	let sfxSliderBg = $derived(
		`linear-gradient(to right, var(--brand-color) 0%, var(--brand-color) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) 100%)`,
	);

	// Fullscreen Setting ---------------------

	let fullscreenButtonText = $state("Fullscreen");

	const fullscreenChangeCheck = function () {
		if (!document.fullscreenElement) {
			fullscreenButtonText = "Fullscreen";
		} else {
			fullscreenButtonText = "Exit Fullscreen";
		}
	};

	onMount(() => {
		document.addEventListener("fullscreenchange", fullscreenChangeCheck);
	});

	onDestroy(() => {
		try {
			document.removeEventListener("fullscreenchange", fullscreenChangeCheck);
		} catch {}
	});

	function toggleFullscreen() {
		playSound("basic_button");

		try {
			if (!document.fullscreenElement) {
				if (document.documentElement.requestFullscreen) {
					document.documentElement.requestFullscreen();
				}
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
			}
		} catch (error) {
			console.error("Error entering / exiting fullscreen: " + error);
		}
	}
</script>

{#if $settingsPopup}
	<Popup verySlim={true}>
		<div class="popup-title">
			<h1>Settings</h1>
		</div>
		<div class="settingsCanvas">
			<div class="settingsBox">
				<p class="textMargin">Unit System:</p>
				<Tabs
					tabs={["Metric", "Imperial"]}
					bind:selected={selectedUnit}
					onchange={(tab) => {
						playSound("basic_button");
						localStorage.setItem("distanceUnit", tab == "Metric" ? "kilometers" : "miles");
					}}
				/>
			</div>
			<div class="settingsBox">
				<p class="textMargin">SFX Volume:</p>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					class="slider sliderMarginTop"
					bind:value={sfxVolumeSliderValue}
					style:background={sfxSliderBg}
					oninput={inputSFXVolumeSlider}
				/>
			</div>
			{#if !$preventFullscreen}
				<div class="settingsBox">
					<p class="textMargin">Toggle Fullscreen:</p>
					<button id="fullscreenButton" class="standardButton white" onclick={toggleFullscreen}>
						<span class="fullscreenIcon">
							<Scan size="17" strokeWidth={3} />
						</span>
						<span id="fullscreenText">{fullscreenButtonText}</span>
					</button>
				</div>
			{/if}
			<div class="settingsBox">
				<p class="textMargin">Legal Information:</p>
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
		height: 80px;
		overflow: hidden;
		flex-grow: 1;
		min-width: 150px;
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

	.sliderMarginTop {
		margin-top: 20px;
		margin-left: 5px;
	}
</style>
