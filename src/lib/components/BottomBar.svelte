<!--bottom toolbar with reset button-->
<script>
	import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { reloadPanorama } from "$lib/utils/loadPanorama";
	import { helpPopup } from "$lib/stores/uiStore";
	import { confirmButtonActive, confirmButtonText } from "$lib/stores/context-specific/confirmButtonStore";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import { supporterLevel } from "$lib/stores/accountStore";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
</script>

<div id="BottomBar" class="BottomBar" class:BottomBarAdShift={$supporterLevel < 2 && !$adsDisabled}>
	<div class="barMenu">
		<button
			class="standardButton bottomBarButton white"
			id="resetButton"
			onclick={() => {
				reloadPanorama(); // No sound, as the reload sound will play
			}}
		>
			<img id="resetButtonImg" src="/img/return_icon.png" alt="Return to start position" />
		</button>
		<button
			class="standardButton bottomBarButton bottomSocialItem white"
			id="discordButton"
			onclick={() => {
				playSound("basic_button");
				window.open("https://discord.gg/CSc3MbDrZ8", "_blank").focus();
			}}
		>
			<img src="/img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" id="discordIcon" />
		</button>
		<button
			class="standardButton bottomBarButton bottomSocialItem white"
			id="redditButton"
			onclick={() => {
				playSound("basic_button");
				window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
			}}
		>
			<img src="/img/reddit.png" alt="Reddit Logo" class="socialIcon bottomBarIcon" />
		</button>
	</div>
	<div class="barMenu bottomRightMenu">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="standardButton bottomBarButton confirmButton white"
			id="confirmButton"
			class:confirmActive={$confirmButtonActive}
			onclick={confirmButtonClicks}
		>
			<button
				class="socialItem"
				id="helpButton"
				class:innerConfirmButtonDisabled={$confirmButtonActive}
				onclick={(element) => {
					element.stopPropagation();
					playSound("basic_button");
					$helpPopup = true;
				}}>?</button
			>
			<p id="guessText">{$confirmButtonText}</p>
		</div>
	</div>
</div>
<div
	id="bottomFooterAds"
	class="bottomFooterAds leaderboardAds"
	style:display={$supporterLevel >= 2 || $adsDisabled ? "none" : ""}
></div>
<div
	class="bottomFooterAds leaderboardAds bottomFooterAdText barMenu"
	style:display={$supporterLevel >= 2 || $adsDisabled ? "none" : ""}
>
	<RemoveAdsText text="Ads keep OpenGuessr free." />
</div>

<style>
	.BottomBar {
		position: fixed;
		bottom: 10px;
		width: calc(100% - 20px);
		height: 95px;
		min-height: 95px;
		max-height: 95px;
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin: auto;
		border-radius: 10px;
		margin-inline: 10px;
		flex: 1;
		z-index: 10;
		transition: background-color 250ms ease;
		pointer-events: none;
	}

	.bottomBarButton {
		background-color: var(--panel-button-color);
		pointer-events: auto;
		font-size: 25px;
	}

	.bottomBarIcon {
		width: 18px !important;
		height: 18px !important;
		vertical-align: 1px;
	}

	.bottomFooterAds {
		position: fixed;
		bottom: 12px;
		left: 0px;
		right: 0px;
		margin-left: auto;
		margin-right: auto;
		padding: 0;
		z-index: 8;
	}

	.socialItem {
		min-width: 40px;
		height: 70%;
		margin-inline: 0;
		border-radius: 5px;
		max-width: 60px;
		background-color: rgba(56, 56, 79, 0.2);
	}

	.confirmButton {
		width: fit-content;
		position: relative;
		pointer-events: none;
		padding-left: 10px;
		padding-right: 30px;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 0;
	}

	.confirmActive {
		pointer-events: auto;
		background-color: var(--brand-color);
	}

	:global(.innerConfirmButtonDisabled) {
		pointer-events: none !important;
		opacity: 0.5;
	}

	#redditButton:hover {
		background-color: #d45f24;
		filter: none;
	}

	#discordButton:hover {
		background-color: #8c2aed;
		filter: none;
	}

	#guessText {
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
	}

	#helpButton {
		pointer-events: auto;
		transition:
			filter 250ms ease,
			opacity 250ms ease;
		margin-left: -6px;
		font-size: 20px;
		height: 30px;
	}

	#helpButton:hover {
		filter: brightness(0.7);
	}

	#resetButtonImg {
		height: auto;
		width: 23px;
		filter: invert();
	}

	.bottomFooterAdText {
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 7;
	}

	@media all and (max-width: 1200px) {
		.bottomSocialItem {
			display: none;
		}
	}

	/* Ad shift */
	@media (orientation: portrait) and (max-width: 800px) {
		.bottomFooterAds {
			bottom: 12px;
		}

		.BottomBarAdShift {
			padding-bottom: 60px;
		}
	}

	.bottomRightMenu {
		width: calc(20% - 8px);
		min-width: 200px;
		margin-right: 60px;
	}

	@media (orientation: portrait) and (max-width: 1200px) {
		.bottomRightMenu {
			margin-right: 0;
		}
	}

	@media all and (orientation: landscape) and (max-width: 1200px) {
		.bottomRightMenu {
			width: calc(25% - 8px);
		}

		.bottomSocialItem {
			display: none;
		}
	}
</style>
