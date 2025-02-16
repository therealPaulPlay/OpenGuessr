<!-- A green bar saying "Purchase a Supporter Tier" etc. -->

<script>
	import { supporterLevel } from "$lib/stores/accountStore";
	import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

<div id="supporterArea" class="supporterArea">
	<div class="supporterPitchText">
		<p id="supporterPitch">{$supporterLevel > 0 ? "Thank you." : "Purchase a supporter tier."}</p>
		<span id="supporterTextSecondary"
			>{$supporterLevel > 0 ? "Contributions keep the game free." : "Your contribution keeps the game free."}</span
		>
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
		background-color: rgba(255, 255, 255, 0.2);
		outline: 3px solid rgba(255, 255, 255, 0.5);
		flex-grow: 1;
		border: none;
	}

	.supporterArea {
		border-radius: 10px;
		background: linear-gradient(30deg, rgba(37, 201, 72, 0.5), rgba(25, 215, 70, 0.7));
		color: white;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		transition: filter 250ms ease;
		gap: 10px;
		padding: 5px;
		width: calc(100% - 10px);
		margin-bottom: 15px;
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

	#viewSupporterBenefits {
		font-size: 22px;
	}

	#supporterTextSecondary {
		opacity: 0.75;
	}

	@media all and (max-width: 1200px) {
		.supporterPitchText p {
			font-size: 22px;
		}

		#supporterTextSecondary {
			display: none !important;
		}
	}
</style>
