<!--bottom toolbar with reset button-->
<script>
	import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { reloadPanorama } from "$lib/utils/loadPanorama";
	import { bugspotPopup, helpPopup } from "$lib/stores/uiStore";
	import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import { supporterLevel } from "$lib/stores/accountStore";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import { showNotification } from "$lib/utils/notifications";
	import { mapExpanded, mapInteractive } from "$lib/stores/context-specific/mapStore";
	import { tooltip } from "$lib/utils/tooltip";
	import { countryGuessr } from "$lib/stores/modeStore";
	import { blur, fade } from "svelte/transition";
	import { ArrowUp, Bug, Map } from "lucide-svelte";
</script>

<div id="BottomBar" class="BottomBar" class:BottomBarAdShift={$supporterLevel < 2 && !$adsDisabled}>
	<div class="bottomLeftMenu">
		<div class="barMenu">
			<button
				class="standardButton white"
				id="resetButton"
				use:tooltip={{ text: "Back to start" }}
				onclick={() => {
					reloadPanorama(); // No sound, as the reload sound will play
				}}
			>
				<img id="resetButtonImg" src="/img/return_icon.png" alt="Return to start position" />
			</button>
		</div>
		<div class="barMenu socialBar">
			<button
				class="linkItem standardButton white"
				use:tooltip={{ text: "Report a bug" }}
				onclick={() => {
					playSound("basic_button");
					$bugspotPopup = true;
				}}
			>
				<Bug size={21} strokeWidth={2.25} style="margin-bottom: -2px;" />
			</button>
			<button
				class="linkItem standardButton white"
				id="discordButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://discord.gg/CSc3MbDrZ8", "_blank").focus();
				}}
			>
				<img src="/img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" />
			</button>
			<button
				class="linkItem standardButton white"
				id="redditButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
				}}
			>
				<img src="/img/reddit.png" alt="Reddit Logo" class="socialIcon bottomBarIcon" />
			</button>
		</div>
	</div>
	{#if !$countryGuessr}
		<div class="barMenu bottomRightMenu" transition:fade={{ duration: 250 }}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="standardButton confirmButton white"
				id="confirmButton"
				class:confirmActive={$confirmButtonActive}
				style:opacity={$mapInteractive || !$mapExpanded ? "" : "0.5"}
				onclick={() => {
					playSound("basic_button");
					if (!$mapExpanded) return ($mapExpanded = true);
					if ($confirmButtonActive) confirmButtonClicks();
					else if ($mapInteractive) showNotification("Place your pin first.");
				}}
			>
				<button
					class="helpButton standardButton white"
					class:innerConfirmButtonDisabled={$confirmButtonActive}
					use:tooltip={{ text: "How to play" }}
					onclick={(element) => {
						element.stopPropagation();
						playSound("basic_button");
						$helpPopup = true;
					}}>?</button
				>
				<p id="guessText">
					{#if $mapExpanded && $mapInteractive}
						Guess
					{:else if !$mapExpanded}
						Map <Map style="margin-bottom: -2px;" size={20} strokeWidth={2.5} />
					{:else if !$mapInteractive}
						Locked in
					{/if}
				</p>
			</div>
		</div>
	{/if}
</div>
{#if $supporterLevel <= 1 && !$adsDisabled}
	<div id="bottomFooterAds" class="bottomFooterAds leaderboardAds" transition:blur></div>
	<div class="bottomFooterAds leaderboardAds bottomFooterAdText barMenu" transition:blur>
		<RemoveAdsText text="Ads keep OpenGuessr free." />
	</div>
{/if}

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

	.linkItem {
		padding: 4px;
		padding-inline: 6px;
	}

	.bottomLeftMenu {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	.bottomBarIcon {
		width: 20px !important;
		height: 20px !important;
		vertical-align: -1px;
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

	#guessText {
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
	}

	.helpButton {
		min-width: 40px;
		box-shadow: none !important;
		border: none;
		padding: 0;
		pointer-events: auto;
		margin-left: -10px;
		height: 34px;
		background-color: var(--box-color-dark-soft);
		border-radius: 2px 0 0 2px;
	}

	.helpButton:hover {
		filter: brightness(0.7);
	}

	#resetButtonImg {
		width: 21px;
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

		.socialBar {
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
