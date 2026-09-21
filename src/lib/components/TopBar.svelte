<script module>
	export let menuIntroductionNote = $state({ visible: false });
</script>

<script>
	import { inMenu, navigationMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { blur } from "svelte/transition";
	import { competition, multiplayer } from "$lib/stores/modeStore.js";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { leaveTutorial } from "./TutorialOverlay.svelte";
	import TopLeftLogo from "./TopLeftLogo.svelte";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { leaveCompetition } from "$lib/logic/competitionLogic";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { LogOut } from "@lucide/svelte";
</script>

{#if !$inMenu}
	<!-- Logo -->
	<TopLeftLogo />

	<!-- Menu -->
	<nav class="menu-button-area bar-menu" transition:blur={{ duration: 250 }}>
		<button
			class="standard-button white"
			{@attach tooltip({ text: "Settings" })}
			onclick={() => {
				playSound("basic_button");
				settingsPopup.set(true);
			}}
		>
			<img src="/img/settings_icon.png" alt="Settings" id="settings-icon" />
		</button>
		<button
			class="standard-button leave-button"
			{@attach tooltip({
				text: "Discover multiplayer, maps, competitions & more!",
				imageSrc: "/img/tutorial/tutorial_menu.png",
				imageAspectRatio: "15 / 7",
				state: menuIntroductionNote,
				maxWidth: 225,
				showDelay: 15_000,
				zIndex: 14,
				mobile: false,
			})}
			onclick={() => {
				playSound("leave_round");

				const toMenu = () => {
					menuIntroductionNote.visible = false;
					$navigationMenu = true;
				};

				// Defer leave
				switch (true) {
					case $tutorial:
						showConfirmPopup("Leave tutorial?", "To explore on your own, you need to leave the tutorial.", () => {
							leaveTutorial();
							toMenu();
						});
						break;
					case $multiplayer:
						showConfirmPopup("Leave room?", "You are about to leave the multiplayer room. Are you sure?", () => {
							leaveMultiplayer();
							toMenu();
						});
						break;
					case $competition:
						leaveCompetition(true);
						toMenu();
						break;
					default:
						toMenu();
						break;
				}
			}}><LogOut size={22} /> <span class="leave-button-span">Leave</span></button
		>
	</nav>
{/if}

<style>
	.menu-button-area {
		display: flex;
		top: var(--box-margin);
		margin-left: auto;
		right: var(--box-margin);
		position: fixed;
		width: auto;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--panel-margin);
		transition: all 250ms ease;
		z-index: 14;
	}

	.leave-button {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	#settings-icon {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -1px;
		user-select: none;
		pointer-events: none;
	}

	@media (max-width: 800px) and (orientation: portrait) {
		.leave-button-span {
			display: none;
		}
	}
</style>
