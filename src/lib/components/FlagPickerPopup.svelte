<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { flagPickerPopup } from "$lib/stores/uiStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import { setProfileFlag } from "$lib/utils/updateProfileData";
	import Flag from "./Flag.svelte";
	import { fade } from "svelte/transition";

	let continentFlags = $state();
	let jsonLoadErrored = $state(false);

	let once = false;

	// Load once on first open
	$effect(async () => {
		if ($flagPickerPopup && !once && !continentFlags) {
			once = true;
			continentFlags = await fetch("/json/country-codes/grouped-flag-codes.json")
				.then((data) => data.json())
				.catch((error) => {
					console.error("Error fetching grouped country codes for flags:", error);
					jsonLoadErrored = true;
				});
		}
		if (!$flagPickerPopup) {
			once = false;
			jsonLoadErrored = false;
		}
	});

	function handleFlagClick(countryCode, buttonSound = false) {
		// Update profile data with selected flag
		if (!buttonSound) playSound("item_select");
		if (buttonSound) playSound("basic_button");
		if ($profileData?.flag == countryCode) {
			// If this is the selected flag, remove it
			handleFlagClick(null, true);
			return;
		}
		setProfileFlag(countryCode);
		profileData.update((data) => {
			return { ...data, flag: countryCode };
		});
	}
</script>

<Popup verySlim={true} bind:open={$flagPickerPopup}>
	<div class="popup-title">
		<h1>Flags</h1>
	</div>
	<div>
		{#if continentFlags}
			{#each Object.entries(continentFlags) as [continent, countries]}
				<div class="continent-section" transition:fade|global={{ duration: 150 }}>
					<p class="continent-title">{continent}</p>
					<div class="flag-selector">
						{#each countries as countryCode}
							<button
								class="flag-button"
								onclick={() => handleFlagClick(countryCode)}
								class:flag-selected={$profileData?.["flag"] == countryCode}
							>
								<Flag code={countryCode} />
							</button>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<p class="loading-text">{jsonLoadErrored ? "Failed to load." : "Loading..."}</p>
		{/if}
	</div>
</Popup>

<style>
	.continent-title {
		padding: 3px;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		text-align: left;
		padding-left: var(--box-margin);
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}

	.loading-text {
		text-align: center;
		width: 100%;
		opacity: 0.5;
		padding-top: var(--layout-margin);
		padding-bottom: 1000px;
	}

	.continent-section {
		margin-bottom: var(--layout-margin);
	}

	.flag-selected {
		border-radius: var(--content-margin);
		background-color: rgba(255, 255, 255, 0.2) !important;
		box-shadow: var(--bulb-shadow);
		filter: brightness(1.5);
	}

	.flag-selector {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: fit-content;
		margin-left: 0;
		padding: var(--panel-margin);
		min-width: calc(100% - 16px);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		gap: var(--box-margin);
		flex-wrap: wrap;
	}

	.flag-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--content-margin);
		transition:
			transform 250ms ease,
			filter 250ms ease;
		width: 40px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flag-button:hover {
		transform: scale(1.1);
	}

	:global(.flag-button svg) {
		width: 100%;
		height: 100%;
	}
</style>
