<!-- A green bar saying "Purchase a Supporter Tier" etc. -->

<script>
	import { supporterLevel } from "$lib/stores/accountStore";
	import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

<div class="supporterArea">
	<div class="supporterPitchText">
		<p id="supporterPitch">{$supporterLevel >= 1 ? "Thank you." : "Purchase a supporter tier."}</p>
		<span id="supporterTextSecondary">Contributions keep the game free.</span>
	</div>
	<button
		id="viewSupporterBenefits"
		class="standardButton"
		onclick={() => {
			playSound("basic_button");
			supporterPopupVisible.set(true);
		}}>View benefits</button
	>
</div>

<style>
	#viewSupporterBenefits {
		background-color: rgba(126, 210, 140, 0.65);
		outline: 3px solid rgba(255, 255, 255, 0.5);
		flex-grow: 1;
		border: none;
		margin: 2px;
		height: 35px;
	}

	.supporterArea {
		border-radius: var(--box-margin);
		background: var(--supporter-green);
		color: white;
		display: flex;
		flex-wrap: wrap;
		box-shadow: var(--bulb-shadow);
		justify-content: space-between;
		align-items: center;
		transition: filter 250ms ease;
		gap: var(--box-margin);
		padding: 5px;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: var(--layout-margin);
	}

	.supporterArea:hover {
		filter: brightness(1.2);
	}

	.supporterArea p {
		padding-right: 5px;
		display: inline;
	}

	.supporterArea span {
		display: inline;
	}

	.supporterPitchText {
		flex-grow: 10;
		padding-inline: 10px;
	}

	#supporterTextSecondary {
		opacity: 0.75;
	}

	@media all and (max-width: 1000px) {
		#supporterTextSecondary {
			display: none !important;
		}
	}
</style>
