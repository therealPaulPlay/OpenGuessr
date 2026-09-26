<script>
	import { countryGuessr } from "$lib/stores/modeStore";
	import { countryGuessrCountriesArray, selectedCountryFieldIndex } from "$lib/stores/context-specific/countryGuessrStore";
	import { playSound } from "$lib/utils/soundManager";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import Flag from "./Flag.svelte";
	import { blur } from "svelte/transition";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import { inMenu } from "$lib/stores/uiStore";

	function selectCountry(index) {
		playSound("item_select");
		selectedCountryFieldIndex.set(index);
		confirmButtonClicks();
	}
</script>

{#if $countryGuessr && !$inMenu}
	<div
		class="country-guessr-selector bar-menu"
		role="menu"
		tabindex="0"
		class:country-guessr-selector-ad-shift={!$adsDisabled}
		transition:blur={{ duration: 250 }}
	>
		{#if $countryGuessrCountriesArray?.length}
			{#each $countryGuessrCountriesArray as country, index}
				<button
					class="country-guessr-holder standard-button white"
					onclick={() => {
						selectCountry(index);
					}}
				>
					<div class="country-guessr-flag">
						<Flag code={country.flag} size={35} showTooltip={false} />
					</div>
					<p class="country-guessr-tag">{country.name}</p>
				</button>
			{/each}
		{:else}
			<p class="loading-text">Loading...</p>
		{/if}
	</div>
{/if}

<style>
	.country-guessr-holder {
		position: relative;
		height: 85px;
		width: 150px;
		border-radius: var(--box-margin);
		text-align: center;
	}

	.country-guessr-flag {
		height: 38px;
		width: 100%;
		margin-top: 3px;
		text-align: center;
	}

	.country-guessr-holder:hover {
		transform: scale(0.98);
	}

	.country-guessr-tag {
		margin-top: auto;
		margin-bottom: var(--content-margin);
		font-size: 22px;
		color: white;
		width: 100%;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.country-guessr-selector {
		position: fixed;
		bottom: 115px;
		left: 0;
		right: 0;
		border-radius: var(--layout-margin);
		margin-inline: auto;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		flex-wrap: wrap;
		transition: bottom 150ms ease;
	}

	.loading-text {
		opacity: 0.5;
		padding: var(--content-margin);
	}

	@media all and (max-width: 1500px) {
		.country-guessr-flag {
			font-size: 25px;
		}

		.country-guessr-tag {
			font-size: 20px;
		}

		.country-guessr-holder {
			height: 75px;
			width: 100px;
			border-radius: calc(var(--layout-margin) - var(--panel-margin));
			flex-grow: 1;
		}

		.country-guessr-selector {
			bottom: 76px;
			max-width: calc(100% - 32px);
		}
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.country-guessr-selector-ad-shift {
			bottom: 136px; /* Shift up to fit ad */
		}
		.country-guessr-selector {
			width: calc(100% - 32px);
			margin-inline: var(--box-margin);
		}
	}
</style>
