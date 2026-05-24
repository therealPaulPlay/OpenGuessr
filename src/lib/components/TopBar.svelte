<script module>
	export let menuIntroductionNote = $state({ visible: false });
</script>

<script>
	import { navigationMenu } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { EllipsisVertical, ExternalLink, LogOut } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { scale } from "svelte/transition";
	import { onMount, tick } from "svelte";
	import { leaveFunction, singleplayer } from "$lib/stores/modeStore.js";
	import { page } from "$app/state";
	import TitleSeparator from "$lib/components/ui/TitleSeparator.svelte";
	import { goto } from "$app/navigation";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { leaveTutorial } from "./TutorialOverlay.svelte";

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

<!-- Menu -->
<nav class="menu-button-area barMenu">
	{#if $leaveFunction}
		<button
			class="standardButton"
			{@attach tooltip({ text: "Leave" })}
			onclick={() => {
				playSound("leave_round");
				$leaveFunction?.();
			}}><LogOut size={22} style="margin-top: 3px; margin-right: -2px;" /></button
		>
	{/if}
	<button
		class="standardButton white menu-button"
		aria-label="Menu"
		onpointerenter={displayHistoryTooltip}
		onmouseleave={hideHistoryTooltip}
		{@attach tooltip({
			text: "Discover multiplayer, maps, competitions & more!",
			imageSrc: "/img/tutorial/tutorial_menu.png",
			state: menuIntroductionNote,
			maxWidth: 225,
			showDelay: 20_000,
			zIndex: 14,
			mobile: false,
		})}
		onclick={() => {
			playSound("basic_button");
			const showNav = () => {
				menuIntroductionNote.visible = false;
				$navigationMenu = true;
			};
			if ($tutorial) {
				return showConfirmPopup("Leave tour?", "To explore on your own, you need to leave the tour.", () => {
					leaveTutorial();
					showNav();
				});
			}
			showNav();
		}}
		><span class="menu-span">Menu</span>
		<EllipsisVertical size={22} />
	</button>
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
					class="history-item standardButton white"
					disabled={!$singleplayer || $tutorial}
					onclick={() => goto(entry.path)}
					><span class="history-item-title">{entry.title}</span>
					<ExternalLink size={20} strokeWidth={2.25} style="opacity: 0.5;" />
				</button>
			{/each}
		</div>
	</div>
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

	.menu-button {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--panel-margin);
	}

	.menu-span {
		margin-bottom: 2px;
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
		.menu-span {
			display: none;
		}
	}
</style>
