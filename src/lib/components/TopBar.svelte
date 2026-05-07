<script>
	import { navigationMenu } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { EllipsisVertical, ExternalLink, LogOut, X } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { scale } from "svelte/transition";
	import { onMount, tick } from "svelte";
	import { leaveFunction, singleplayer } from "$lib/stores/modeStore.js";
	import { page } from "$app/state";
	import TitleSeparator from "$lib/components/ui/TitleSeparator.svelte";
	import { goto } from "$app/navigation";

	let showIntroductionNote = $state(false);
	let showHistoryTooltip = $state(false);
	let navigationHistory = $state([]);
	let hideTooltipTimeout = null;

	onMount(() => {
		const showIntroduction = localStorage.getItem("menuIntroduction") == null;
		if (showIntroduction && !window.matchMedia("(max-width: 800px) and (orientation: portrait)").matches)
			showIntroductionNote = true;
	});

	function disableIntroductionNote() {
		showIntroductionNote = false;
		localStorage.setItem("menuIntroduction", true);
	}

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
			use:tooltip={{ text: "Leave" }}
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
		onclick={() => {
			disableIntroductionNote();
			$navigationMenu = !$navigationMenu;
			playSound("basic_button");
		}}
		><span class="menu-span">Menu</span>
		<EllipsisVertical size={22} />
	</button>
</nav>

{#if showIntroductionNote}
	<div class="tooltip menu-tooltip menu-button-area" transition:scale={{ duration: 150, start: 0.95 }}>
		<div class="tooltip-arrow menu-tooltip-arrow" data-placement="bottom"></div>
		<button
			class="standardButton white tooltip-close-button"
			aria-label="close introduction note"
			onclick={disableIntroductionNote}
		>
			<X size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
		</button>
		<img alt="Menu introcution" src="/img/menu_introduction.png" class="menu-tooltip-image" />
		<p>Discover multiplayer, maps, competitions & more!</p>
	</div>
{/if}

{#if showHistoryTooltip && navigationHistory.length > 0 && !showIntroductionNote}
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
				<button class="history-item standardButton white" disabled={!$singleplayer} onclick={() => goto(entry.path)}
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
		top: 82px;
		width: 225px;
		display: flex;
		flex-direction: column;
		padding: var(--box-margin);
		border-radius: var(--box-margin);
	}

	.tooltip-close-button {
		margin-left: auto;
		box-shadow: none;
		background: none;
		border: none;
		padding: 3px;
		height: unset;
		opacity: 0.75;
	}

	.menu-tooltip p {
		margin-inline: var(--content-margin);
		margin-bottom: var(--content-margin);
	}

	.menu-tooltip-arrow {
		right: 29px;
		top: -8px;
		width: 10px;
		height: 8px;
	}

	.menu-tooltip-image {
		height: 105px;
		width: 225px;
		margin-top: -40px;
		margin-bottom: -5px;
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
