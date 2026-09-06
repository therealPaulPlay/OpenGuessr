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
	import {
		chatArray,
		chatMutedPlayers,
		mobileChatLastOpenedMsgCount,
		socket,
	} from "$lib/stores/context-specific/multiplayerStore";
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
		if (!$tutorial || $resultScreenEnabled) returnTutorialNote.visible = false;
	});

	// Gameplay ad registration ----------------------------------------------------------------
	$effect(async () => {
		// Whenever the gameplay ad gets (re-)mounted, (re-)register
		if (!$adsDisabled) {
			await tick();
			registerGameplayAd();
		}
	});

	// Current message amount in the chat (visible ones only) ---------------------------------------------------------
	let chatMsgAmount = $derived(
		$chatArray?.filter(
			(chat) =>
				chat.clientId != "server" &&
				!$chatMutedPlayers?.includes(chat.clientId) &&
				(chat.teamIndex == null || chat.teamIndex == getTeamFromClientId(get(socket)?.id)),
		)?.length || 0,
	);
</script>

<div id="bottom-bar" class="bottom-bar">
	<div class="bottom-left-menu">
		<div class="bar-menu">
			<button
				class="standard-button white"
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
				<img id="reset-button-img" src="/img/return_icon.png" alt="Return to start position" />
				<span class="reset-button-text">Return</span>
			</button>
			{#if $multiplayer}
				<button
					class="standard-button white mobile-chat-button"
					{@attach tooltip({ text: "Chat" })}
					onclick={() => {
						playSound("basic_button");
						$chatMobilePopup = true;
					}}
				>
					{#if chatMsgAmount > $mobileChatLastOpenedMsgCount}
						<MessageSquareDot size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{:else}
						<MessageSquareMore size={22} strokeWidth={2.25} style="margin-top: 3px;" />
					{/if}
				</button>
			{/if}
		</div>
	</div>
	{#if !$countryGuessr}
		<div class="bar-menu bottom-right-menu" transition:blur={{ duration: 150 }}>
			<button
				class="standard-button confirm-button white"
				id="confirm-button"
				class:confirm-active={$confirmButtonActive}
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
			</button>
		</div>
	{/if}
</div>

{#if !$adsDisabled}
	<div class="gameplay-ad-area bar-menu" transition:blur={{ duration: 150 }}>
		<div class="gameplay-ad" id="gameplay-ad" data-fuse="Game_incontent_1"></div>
		<p class="no-adverts-text">Ads keep OpenGuessr free.</p>
	</div>
{/if}

<style>
	.bottom-bar {
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

	.no-adverts-text {
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

	.bottom-left-menu {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	.gameplay-ad-area {
		position: fixed;
		left: 0;
		right: 0;
		bottom: var(--box-margin);
		padding: 0 !important;
		margin-inline: auto;
		z-index: 8;
		text-align: center !important;
	}

	.gameplay-ad-area,
	.gameplay-ad {
		width: 728px;
		height: 90px;
	}

	.gameplay-ad {
		overflow: hidden;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.gameplay-ad-area,
		.gameplay-ad {
			width: 320px;
			height: 50px;
		}
	}

	@media (max-width: 1500px) {
		.gameplay-ad-area,
		.gameplay-ad {
			width: 320px;
			height: 50px;
		}
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.gameplay-ad-area,
		.gameplay-ad {
			height: 50px;
		}

		.gameplay-ad-area {
			width: calc(100% - 20px);
		}
	}

	.confirm-button {
		min-width: fit-content;
		width: 100%;
		justify-content: center;
	}

	.confirm-active {
		pointer-events: auto;
		opacity: 1;
		background-color: var(--brand-color);
	}

	:global(.inner-confirm-button-disabled) {
		pointer-events: none !important;
		opacity: 0.5;
	}

	#reset-button-img {
		width: 21px;
		height: 17px;
		user-select: none;
		pointer-events: none;
	}

	.reset-button-text {
		margin-left: var(--panel-margin);
	}

	.bottom-right-menu {
		width: max(calc(20% - (var(--box-margin) + 2px)), 200px);
		margin-right: 60px;
	}

	.mobile-chat-button {
		display: none;
	}

	/* Mobile adjustments */
	@media (orientation: portrait) and (max-width: 800px) {
		.gameplay-ad-area {
			bottom: calc(56px + var(--box-margin) * 2); /* Guess button is 56px high */
		}

		.mobile-chat-button {
			display: block;
		}

		.bottom-right-menu {
			flex-grow: 1;
			margin-right: 0;
		}

		.reset-button-text {
			display: none;
		}
	}
</style>
