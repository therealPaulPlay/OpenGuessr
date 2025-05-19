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
	import { showNotification } from "$lib/utils/notifications";
	import { mapVisible } from "$lib/stores/context-specific/mapStore";
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
		<!-- Links -->
		<div class="socialLinkArea">
			<button
				class="bottomSocialItem linkItem"
				id="discordButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://discord.gg/CSc3MbDrZ8", "_blank").focus();
				}}
			>
				<img src="/img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" />
			</button>
			<button
				class="bottomSocialItem linkItem"
				id="redditButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
				}}
			>
				<img src="/img/reddit.png" alt="Reddit Logo" class="socialIcon bottomBarIcon" />
			</button>
			<button
				class="bottomSocialItem linkItem"
				id="blueskyButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://bsky.app/profile/paulplay.bsky.social", "_blank").focus();
				}}
			>
				<img src="/img/bluesky.png" alt="Bluesky Logo" class="socialIcon bottomBarIcon" />
			</button>
		</div>
	</div>
	<div class="barMenu bottomRightMenu">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="standardButton bottomBarButton confirmButton white"
			id="confirmButton"
			class:confirmActive={$confirmButtonActive}
			onclick={() => {
				playSound("basic_button");
				if ($confirmButtonActive) confirmButtonClicks();
				else if ($mapVisible) showNotification("Place a pin first.");
			}}
		>
			<button
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

	.socialLinkArea {
		border-radius: 5px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		box-sizing: border-box;
		background-color: var(--panel-button-color);
		display: flex;
		gap: 3px;
		padding: 3px;
		user-select: none;
		box-shadow: 0 3px 1px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.linkItem {
		border-radius: 3px;
		padding: 4px;
		padding-inline: 6px;
		height: 28px;
		transition:
			background-color 250ms ease,
			color 250ms ease;
		background-color: rgba(43, 43, 57, 0.2);
	}

	.bottomBarButton {
		background-color: var(--panel-button-color);
		pointer-events: auto;
		font-size: 25px;
	}

	.bottomBarIcon {
		width: 20px !important;
		height: 20px !important;
		vertical-align: -3px;
	}

	.bottomFooterAds {
		position: fixed;
		bottom: 10px;
		left: 0px;
		right: 0px;
		margin-left: auto;
		margin-right: auto;
		padding: 0;
		z-index: 8;
	}

	.confirmButton {
		width: fit-content;
		position: relative;
		padding-left: 10px;
		padding-right: 30px;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.confirmActive {
		pointer-events: auto;
		opacity: 1;
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
		background-color: #a33ae9;
		filter: none;
	}

	#blueskyButton:hover {
		background-color: #2286c9;
		filter: none;
	}

	#guessText {
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
	}

	#helpButton {
		min-width: 40px;
		margin-inline: 0;
		max-width: 60px;
		background-color: rgba(43, 43, 57, 0.2);
		pointer-events: auto;
		transition:
			filter 250ms ease,
			opacity 250ms ease;
		margin-left: -7px;
		font-size: 20px;
		border-radius: 3px;
		height: 30px;
	}

	#helpButton:hover {
		filter: brightness(0.7);
	}

	#resetButtonImg {
		width: 21px;
		vertical-align: 2px;
	}

	.bottomFooterAdText {
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 7;
	}

	.bottomRightMenu {
		width: calc(20% - (var(--box-margin) + 2px));
		min-width: 200px;
		margin-right: 60px;
		margin-left: var(--panel-margin);
	}

	/* Ad shift */
	@media (orientation: portrait) and (max-width: 800px) {
		.bottomFooterAds {
			bottom: 10px;
		}

		.BottomBarAdShift {
			padding-bottom: 58px;
		}

		.socialLinkArea {
			display: none;
		}

		.bottomRightMenu {
			flex-grow: 1;
		}
	}

	@media (orientation: portrait) and (max-width: 1200px) {
		.bottomRightMenu {
			margin-right: 0;
		}
	}
</style>
