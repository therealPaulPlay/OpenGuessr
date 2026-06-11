<!-- A green bar saying "Purchase a Supporter Tier" etc. -->

<script>
	import { goto } from "$app/navigation";
	import { supporterLevel } from "$lib/stores/accountStore";
	import { profilePopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

<div class="supporter-area">
	<div class="supporter-pitch-text">
		<p id="supporter-pitch">{$supporterLevel >= 1 ? "Thank you." : "Purchase a supporter tier."}</p>
		<span id="supporter-text-secondary">Contributions keep the game free.</span>
	</div>
	<button
		id="view-supporter-benefits"
		class="standard-button"
		onclick={() => {
			playSound("basic_button");
			$profilePopup = false;
			goto("/shop#supporter");
		}}>View benefits</button
	>
</div>

<style>
	#view-supporter-benefits {
		background-color: rgba(126, 210, 140, 0.65);
		outline: 3px solid rgba(255, 255, 255, 0.5);
		flex-grow: 1;
		border: none;
		margin: 2px;
		height: 35px;
	}

	.supporter-area {
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
		padding: var(--content-margin);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: var(--layout-margin);
	}

	.supporter-area:hover {
		filter: brightness(1.2);
	}

	.supporter-area p {
		padding-right: var(--content-margin);
		display: inline;
	}

	.supporter-area span {
		display: inline;
	}

	.supporter-pitch-text {
		flex-grow: 10;
		padding-inline: var(--box-margin);
	}

	#supporter-text-secondary {
		opacity: 0.75;
	}

	@media all and (max-width: 1000px) {
		#supporter-text-secondary {
			display: none !important;
		}
	}
</style>
