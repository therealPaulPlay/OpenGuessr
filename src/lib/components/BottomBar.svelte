<!--bottom toolbar with reset button-->
<script>
	import { playSound } from "$lib/utils/soundManager";
	import { bugspotPopup, chatMobilePopup, helpPopup, loadingScreenVisible } from "$lib/stores/uiStore";
	import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import { supporterLevel } from "$lib/stores/accountStore";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import { showNotification } from "$lib/utils/notifications";
	import { mapExpanded, mapInteractive } from "$lib/stores/context-specific/mapStore";
	import { tooltip } from "$lib/utils/tooltip";
	import { countryGuessr, multiplayer } from "$lib/stores/modeStore";
	import { blur, fade } from "svelte/transition";
	import { ArrowUp, Bug, Map, MessageSquareDot, MessageSquareMore } from "@lucide/svelte";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { iframeElement, panoramaSrc } from "$lib/stores/locationStore";
	import { chatArray, mobileChatLastOpenedMsgCount } from "$lib/stores/context-specific/multiplayerStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { onMount } from "svelte";
	import { registerGameplayAd } from "$lib/utils/ads";

	function reloadPanorama() {
		playSound("reload");
		$loadingScreenVisible = true;
		$iframeElement.src = $panoramaSrc;
	}

	onMount(registerGameplayAd);
</script>

<div id="BottomBar" class="BottomBar" class:BottomBarAdShift={!$adsDisabled}>
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
			{#if $multiplayer}
				<button
					class="standardButton white mobileChatButton"
					use:tooltip={{ text: "Chat" }}
					onclick={() => {
						playSound("basic_button");
						$chatMobilePopup = true;
					}}
				>
					{#if $chatArray?.filter((i) => i.username != "Server")?.length === $mobileChatLastOpenedMsgCount}
						<MessageSquareMore size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{:else}
						<MessageSquareDot size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{/if}
				</button>
			{/if}
		</div>
		<div class="barMenu socialBar">
			<button
				class="linkItem standardButton white"
				use:tooltip={{ text: "Report bug" }}
				onclick={() => {
					playSound("basic_button");
					$bugspotPopup = true;
				}}
			>
				<Bug size={21} strokeWidth={2.25} style="margin-bottom: -2px;" />
			</button>
			<button
				class="linkItem standardButton white"
				use:tooltip={{ text: "Discord" }}
				id="discordButton"
				onclick={() => {
					playSound("basic_button");
					window.open($discordInviteUrl, "_blank").focus();
				}}
			>
				<img src="/img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" />
			</button>
			<button
				class="linkItem standardButton white"
				use:tooltip={{ text: "Reddit" }}
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
						Map <Map style="margin-bottom: -2px;" size={20} strokeWidth={2.25} />
					{:else if !$mapInteractive}
						Locked in
					{/if}
				</p>
			</div>
		</div>
	{/if}
</div>

{#if !$adsDisabled}
	<div class="gameplayAdArea barMenu" transition:blur>
		<div
			class="gameplayAd"
			id="gameplayAd"
			data-fuse="Game_incontent_1"
			style:display={$resultScreenEnabled ? "none" : ""}
		></div>
		<p class="noAdvertsText">Ads keep OpenGuessr free.</p>
	</div>
{/if}

<style>
	.BottomBar {
		position: fixed;
		bottom: var(--box-margin);
		width: calc(100% - 20px);
		height: 95px;
		min-height: 95px;
		max-height: 95px;
		gap: var(--box-margin);
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin: auto;
		border-radius: var(--box-margin);
		margin-inline: var(--box-margin);
		flex: 1;
		z-index: 10;
		transition: background-color 250ms ease;
		pointer-events: none;
	}

	.linkItem {
		padding: 4px;
		padding-inline: 6px;
	}

	.noAdvertsText {
		position: absolute;
		text-align: center;
		color: white;
		opacity: 0.25;
		left: 50%;
		top: 50%;
		user-select: none;
		text-wrap: nowrap;
		z-index: -1;
		transform: translate(-50%, -50%);
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

	.gameplayAdArea {
		position: fixed;
		left: 0;
		right: 0;
		bottom: var(--box-margin);
		padding: 0 !important;
		margin-inline: auto;
		z-index: 8;
		text-align: center !important;
	}

	.gameplayAdArea,
	.gameplayAd {
		width: 728px;
		height: 90px;
	}

	.gameplayAd {
		overflow: hidden;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.gameplayAdArea,
		.gameplayAd {
			width: 320px;
			height: 50px;
		}
	}

	@media (max-width: 1500px) {
		.gameplayAdArea,
		.gameplayAd {
			width: 320px;
			height: 50px;
		}
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.gameplayAdArea,
		.gameplayAd {
			height: 50px;
		}

		.gameplayAdArea {
			width: calc(100% - 20px);
		}
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

	.bottomRightMenu {
		width: max(calc(20% - (var(--box-margin) + 2px)), 200px);
		margin-right: 60px;
		overflow: hidden;
	}

	.mobileChatButton {
		display: none;
	}

	/* Mobile adjustments */
	@media (orientation: portrait) and (max-width: 800px) {
		.gameplayAdArea {
			bottom: var(--box-margin);
		}

		.BottomBarAdShift {
			padding-bottom: calc(50px + var(--box-margin)); /* Ad is 50px high */
		}

		.socialBar {
			display: none;
		}

		.mobileChatButton {
			display: block;
		}

		.bottomRightMenu {
			flex-grow: 1;
			margin-right: 0;
		}
	}
</style>
