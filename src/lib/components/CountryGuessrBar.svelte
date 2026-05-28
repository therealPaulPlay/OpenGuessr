<script>
	import { countryGuessr } from "$lib/stores/modeStore";
	import { countryGuessrCountriesArray, selectedCountryField } from "$lib/stores/context-specific/countryGuessrStore";
	import { playSound } from "$lib/utils/soundManager";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import * as FlagIcons from "svelte-flag-icons";
	import { gameplayAdVisible } from "$lib/stores/uiStore";
	import { blur } from "svelte/transition";

	function selectCountry(index) {
		playSound("item_select");
		selectedCountryField.set(index);
		confirmButtonClicks();
	}
</script>

{#if $countryGuessr}
	<div
		class="countryGuessrSelector barMenu"
		role="menu"
		tabindex="0"
		class:countryGuessrSelectorAdShift={$gameplayAdVisible}
		transition:blur={{ duration: 150 }}
	>
		{#if $countryGuessrCountriesArray?.length}
			{#each $countryGuessrCountriesArray as country, index}
				<button
					class="countryGuessrHolder standardButton white"
					onclick={() => {
						selectCountry(index);
					}}
				>
					<div class="countryGuessrFlag">
						{#if FlagIcons[country.flag]}
							<svelte:component this={FlagIcons[country.flag]} size={35} />
						{/if}
					</div>
					<p class="countryGuessrTag">{country.name}</p>
				</button>
			{/each}
		{:else}
			<p class="loadingText">Loading...</p>
		{/if}
	</div>
{/if}

<style>
	.countryGuessrHolder {
		position: relative;
		height: 85px;
		width: 150px;
		border-radius: var(--box-margin);
		text-align: center;
	}

	.countryGuessrFlag {
		height: 38px;
		width: 100%;
		margin-top: 3px;
		text-align: center;
	}

	.countryGuessrHolder:hover {
		transform: scale(0.98);
	}

	.countryGuessrTag {
		margin-top: auto;
		margin-bottom: var(--content-margin);
		font-size: 22px;
		color: white;
		width: 100%;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.countryGuessrSelector {
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

	.loadingText {
		opacity: 0.5;
		padding: var(--content-margin);
	}

	@media all and (max-width: 1500px) {
		.countryGuessrFlag {
			font-size: 25px;
		}

		.countryGuessrTag {
			font-size: 20px;
		}

		.countryGuessrHolder {
			height: 75px;
			width: 100px;
			border-radius: calc(var(--layout-margin) - var(--panel-margin));
			flex-grow: 1;
		}

		.countryGuessrSelector {
			bottom: 76px;
			max-width: calc(100% - 32px);
		}
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.countryGuessrSelectorAdShift {
			bottom: 136px; /* Shift up to fit ad */
		}
		.countryGuessrSelector {
			width: calc(100% - 32px);
			margin-inline: var(--box-margin);
		}
	}
</style>
