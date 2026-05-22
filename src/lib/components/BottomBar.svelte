<script>
	import { playSound } from "$lib/utils/soundManager";
	import { chatMobilePopup, loadingScreenVisible } from "$lib/stores/uiStore";
	import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import { showNotification } from "$lib/utils/notifications";
	import { mapExpanded, mapInteractive } from "$lib/stores/context-specific/mapStore";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { countryGuessr, multiplayer } from "$lib/stores/modeStore";
	import { blur } from "svelte/transition";
	import { Map, MessageSquareDot, MessageSquareMore } from "@lucide/svelte";
	import { iframeElement, panoramaSrc } from "$lib/stores/locationStore";
	import { chatArray, mobileChatLastOpenedMsgCount, socket } from "$lib/stores/context-specific/multiplayerStore";
	import { registerGameplayAd } from "$lib/utils/ads";
	import { get } from "svelte/store";
	import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { tutorialStep, tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { tick } from "svelte";

	// Show return when in tutorial ------------------------------------------------------------------
	let returnTutorialNote = $state({ visible: false });
	let hasShownTutorialNote = false;

	$effect(() => {
		if ($tutorial && $tutorialStep === 0 && !hasShownTutorialNote) {
			returnTutorialNote.visible = true;
			hasShownTutorialNote = true;
		}
		if (!$tutorial && returnTutorialNote.visible) returnTutorialNote.visible = false;
		if ($resultScreenEnabled && returnTutorialNote.visible) returnTutorialNote.visible = false;
	});

	// Gameplay ad registration ----------------------------------------------------------------
	let tutorialHiddenOnce = $state(false);
	let showGameplayAd = $derived(!$adsDisabled && tutorialHiddenOnce);

	$effect(() => {
		// Tutorial step is -1 until the check is done, so 0 means disabled + checked
		// If the tutorial overlay comes up a second time, ignore (only fire once)
		if ($tutorialStep === 0 && !tutorialHiddenOnce) tutorialHiddenOnce = true;
	});

	$effect(async () => {
		// Whenever the gameplay ad gets (re-)mounted, (re-)register
		if (showGameplayAd) {
			await tick();
			registerGameplayAd();
		}
	});
</script>

<div id="bottomBar" class="bottomBar">
	<div class="bottomLeftMenu">
		<div class="barMenu">
			<button
				class="standardButton white"
				{@attach tooltip({
					text: "Click to return to the spawn.",
					state: returnTutorialNote,
					imageSrc: "/img/tutorial/tutorial_return.png",
					zIndex: 10,
					showDelay: 2000,
				})}
				onclick={() => {
					if (returnTutorialNote.visible) returnTutorialNote.visible = false;
					playSound("reload");
					$loadingScreenVisible = true;
					$iframeElement.src = $panoramaSrc;
				}}
			>
				<img id="resetButtonImg" src="/img/return_icon.png" alt="Return to start position" />
				<span class="resetButtonText">Return</span>
			</button>
			{#if $multiplayer}
				<button
					class="standardButton white mobileChatButton"
					{@attach tooltip({ text: "Chat" })}
					onclick={() => {
						playSound("basic_button");
						$chatMobilePopup = true;
					}}
				>
					{#if $chatArray?.filter((i) => i.username != "Server" && (i.teamIndex == null || i.teamIndex == getTeamFromClientId(get(socket)?.id)))?.length === $mobileChatLastOpenedMsgCount}
						<MessageSquareMore size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{:else}
						<MessageSquareDot size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{/if}
				</button>
			{/if}
		</div>
	</div>
	{#if !$countryGuessr}
		<div class="barMenu bottomRightMenu" transition:blur={{ duration: 150 }}>
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
				{#if $mapExpanded && $mapInteractive}
					Guess
				{:else if !$mapExpanded}
					Map <Map style="margin-bottom: -2px;" size={20} strokeWidth={2.25} />
				{:else if !$mapInteractive}
					Locked in
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if showGameplayAd}
	<div class="gameplayAdArea barMenu" transition:blur={{ duration: 150 }}>
		<div class="gameplayAd" id="gameplayAd" data-fuse="Game_incontent_1"></div>
		<p class="noAdvertsText">Ads keep OpenGuessr free.</p>
	</div>
{/if}

<style>
	.bottomBar {
		position: fixed;
		bottom: var(--box-margin);
		left: var(--box-margin);
		right: var(--box-margin);
		border-radius: var(--box-margin);
		width: calc(100% - 20px);
		height: 95px;
		gap: var(--box-margin);
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin: auto;
		z-index: 10;
		transition: background-color 250ms ease;
		pointer-events: none;
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
		max-width: calc(100% - var(--layout-margin) * 2);
		overflow: hidden;
		text-overflow: ellipsis;
		z-index: -1;
		transform: translate(-50%, -50%);
	}

	.bottomLeftMenu {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
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
		min-width: fit-content;
		width: 100%;
		justify-content: center;
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

	#resetButtonImg {
		width: 21px;
		height: 17px;
	}

	.resetButtonText {
		margin-left: var(--panel-margin);
	}

	.bottomRightMenu {
		width: max(calc(20% - (var(--box-margin) + 2px)), 200px);
		margin-right: 60px;
	}

	.mobileChatButton {
		display: none;
	}

	/* Mobile adjustments */
	@media (orientation: portrait) and (max-width: 800px) {
		.gameplayAdArea {
			bottom: calc(56px + var(--box-margin) * 2); /* Guess button is 56px high */
		}

		.mobileChatButton {
			display: block;
		}

		.bottomRightMenu {
			flex-grow: 1;
			margin-right: 0;
		}

		.resetButtonText {
			display: none;
		}
	}
</style>
