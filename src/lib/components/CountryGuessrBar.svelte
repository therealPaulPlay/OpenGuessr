<script>
	import { countryGuessr, multiplayer, competition } from "$lib/stores/modeStore";
	import { selectedCountryField } from "$lib/stores/context-specific/countryGuessrStore";
	import { playSound } from "$lib/utils/soundManager";
	import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";

	function selectCountry(fieldNr) {
		playSound("item_select");
		selectedCountryField.set(fieldNr);
		confirmButtonActive.set(true);
	}

	function clickConfirm(event) {
		if (event.key === " ") {
			if ($confirmButtonActive) {
				confirmButtonClicks();
			} else {
				console.warn("Cannot click on confirm button - pointer events is none.");
			}
		}
	}
</script>

{#if $countryGuessr && !$multiplayer && !$competition}
	<div class="countryGuessrSelector barMenu" onkeyup={clickConfirm} role="menu" tabindex="0">
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 1}
			onclick={() => {
				selectCountry(1);
			}}
		>
			<p id="countryFlag1" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag1" class="countryGuessrTag">Country 1</p>
		</button>
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 2}
			onclick={() => {
				selectCountry(2);
			}}
		>
			<p id="countryFlag2" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag2" class="countryGuessrTag">Country 2</p>
		</button>
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 3}
			onclick={() => {
				selectCountry(3);
			}}
		>
			<p id="countryFlag3" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag3" class="countryGuessrTag">Country 3</p>
		</button>
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 4}
			onclick={() => {
				selectCountry(4);
			}}
		>
			<p id="countryFlag4" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag4" class="countryGuessrTag">Country 4</p>
		</button>
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 5}
			onclick={() => {
				selectCountry(5);
			}}
		>
			<p id="countryFlag5" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag5" class="countryGuessrTag">Country 5</p>
		</button>
		<button
			class="countryGuessrHolder standardButton white"
			class:selectedCountry={$selectedCountryField == 6}
			onclick={() => {
				selectCountry(6);
			}}
		>
			<p id="countryFlag6" class="countryGuessrFlag">🇦🇽</p>
			<p id="countryTag6" class="countryGuessrTag">Country 6</p>
		</button>
	</div>
{/if}

<style>
	.countryGuessrHolder {
		position: relative;
		height: 85px;
		width: 150px;
		border-radius: 7px;
		text-align: center;
	}

	:global(.selectedCountry) {
		filter: brightness(1.2);
		background-color: rgba(255, 255, 255, 0.3) !important;
	}

	.countryGuessrFlag {
		font-size: 45px;
		margin-bottom: auto;
		margin-top: 5px;
		margin-bottom: 5px;
		width: 100%;
		line-height: 0.7;
	}

	.countryGuessrHolder:hover {
		transform: scale(0.98);
	}

	.countryGuessrTag {
		margin-top: auto;
		margin-bottom: 5px;
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
		margin-inline: auto;
		display: flex;
		border-radius: 12px;
		pointer-events: auto;
		justify-content: space-between;
		z-index: 10;
		flex-wrap: wrap;
	}

	@media all and (max-width: 1500px) {
		.countryGuessrFlag {
			font-size: 25px;
		}

		.countryGuessrTag {
			font-size: 18px;
		}

		.countryGuessrHolder {
			height: 75px;
			width: 100px;
			border-radius: 7px;
			flex-grow: 1;
		}

		.countryGuessrSelector {
			bottom: 76px;
			max-width: calc(100% - 32px);
		}
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.countryGuessrSelector {
			bottom: 134px;
		}
		.countryGuessrSelector {
			width: calc(100% - 32px);
			margin-inline: 10px;
		}
	}
</style>
