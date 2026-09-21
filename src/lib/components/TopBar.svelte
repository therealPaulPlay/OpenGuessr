<script module>
	export let menuIntroductionNote = $state({ visible: false });
</script>

<script>
	import { inMenu, navigationMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { ExternalLink, LogOut } from "@lucide/svelte";
	import { blur, scale } from "svelte/transition";
	import { onMount, tick } from "svelte";
	import { competition, multiplayer, singleplayer } from "$lib/stores/modeStore.js";
	import { page } from "$app/state";
	import TitleSeparator from "$lib/components/ui/TitleSeparator.svelte";
	import { goto } from "$app/navigation";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { leaveTutorial } from "./TutorialOverlay.svelte";
	import TopLeftLogo from "./TopLeftLogo.svelte";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { leaveCompetition } from "$lib/logic/competitionLogic";
	import { tooltip } from "$lib/utils/tooltip.svelte";

	let showHistoryTooltip = $state(false);
	let navigationHistory = $state([]);
	let hideTooltipTimeout = null;

	// Load & track page history for quick access
	onMount(() => {
		const stored = localStorage.getItem("navigationHistory");
		if (stored) {
			try {
				navigationHistory = JSON.parse(stored);
			} catch {
				navigationHistory = [];
			}
		}
	});

	$effect(() => {
		const currentPath = page.url.pathname;
		if (currentPath === "/" || !currentPath) return; // Skip root
		if (currentPath.startsWith("/maps/community/")) return; // Skip individual community maps
		if (navigationHistory.length > 0 && navigationHistory[0]?.path === currentPath) return; // Skip if last one is identical

		// Wait for document title to update
		tick().then(() => {
			const currentTitle = document.title;
			const historyEntry = { path: currentPath, title: currentTitle };
			navigationHistory = [historyEntry, ...navigationHistory.filter((p) => p.path !== currentPath)].slice(0, 3);
			localStorage.setItem("navigationHistory", JSON.stringify(navigationHistory));
		});
	});

	function hideHistoryTooltip() {
		hideTooltipTimeout = setTimeout(() => {
			showHistoryTooltip = false;
		}, 150);
	}

	function displayHistoryTooltip(e) {
		if (e.pointerType == "touch") return;
		if (hideTooltipTimeout) {
			clearTimeout(hideTooltipTimeout);
			hideTooltipTimeout = null;
		}
		showHistoryTooltip = true;
	}
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

	{#if showHistoryTooltip && navigationHistory.length > 0 && !menuIntroductionNote.visible}
		<div
			class="tooltip menu-tooltip history-tooltip menu-button-area"
			role="tooltip"
			transition:scale={{ duration: 150, start: 0.95 }}
			onpointerenter={displayHistoryTooltip}
			onmouseleave={hideHistoryTooltip}
		>
			<div class="tooltip-arrow menu-tooltip-arrow" data-placement="bottom"></div>
			<TitleSeparator text="Last visited" noMargin={true} />
			<div class="history-list">
				{#each navigationHistory as entry}
					<button
						class="history-item standard-button white"
						disabled={!$singleplayer || $tutorial}
						onclick={() => goto(entry.path)}
						><span class="history-item-title">{entry.title}</span>
						<ExternalLink size={20} strokeWidth={2.25} style="opacity: 0.5;" />
					</button>
				{/each}
			</div>
		</div>
	{/if}
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

	.menu-tooltip {
		top: 76px;
		width: 225px;
		display: flex;
		flex-direction: column;
		padding: var(--box-margin);
		border-radius: var(--box-margin);
	}

	.menu-tooltip-arrow {
		right: 30px;
		top: -6px;
	}

	.history-tooltip {
		width: 150px;
		padding: var(--layout-margin);
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: var(--panel-margin);
		width: 100%;
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

	.history-item {
		padding: 0;
		border: none;
		box-shadow: none;
		background: transparent;
		text-align: start;
		height: unset;
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		width: 100%;
	}

	.history-item-title {
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 120px;
		display: inline-block;
	}

	@media (max-width: 800px) and (orientation: portrait) {
		.leave-button-span {
			display: none;
		}
	}
</style>
