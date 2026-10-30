<script>
	let { children } = $props();
	import { playSound } from "$lib/utils/soundManager";
	import { matchmakingActive } from "$lib/stores/context-specific/multiplayerStore";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { goto, afterNavigate, beforeNavigate } from "$app/navigation";
	import { Home } from "@lucide/svelte";
	import { page } from "$app/state";
	import { mainMenu } from "$lib/stores/uiStore";
	import { multiplayer } from "$lib/stores/modeStore";

	import { setContext } from "svelte";

	// Snapshot store for manual snapshot management
	const snapshotStore = new Map();
	setContext("snapshotStore", snapshotStore);

	let historyStack = $state([]);
	let isGoingBack = false; // Distinguishes goBack() from forward navigation since both use goto()

	afterNavigate(({ type, from, to }) => {
		if (type === "popstate" || isGoingBack) {
			if (historyStack.length > 0) historyStack.pop();
			isGoingBack = false;
		} else if (from?.url?.pathname && from.url.pathname !== to?.url?.pathname) {
			historyStack.push(from.url.pathname + from.url.search);
		}
	});

	function goBack() {
		isGoingBack = true;
		goto(historyStack.at(-1) || "/", { state: { restoreSnapshot: true } });
	}

	// For-multiplayer pages (pages for the host settings) only count as multiplayer before multiplayer starts (bc afterwards, you can't change these settings anymore)
	const isMultiplayerUrl = (url) =>
		url?.pathname.startsWith("/multiplayer/") || (url?.searchParams.has("for-multiplayer") && !$multiplayer);

	// Leave multiplayer when navigating out of multiplayer pages (except moving to "/" on game start, where the main menu is closed first)
	beforeNavigate(({ from, to, complete }) => {
		if (isMultiplayerUrl(from?.url) && !isMultiplayerUrl(to?.url) && !(to?.url.pathname === "/" && !$mainMenu)) {
			// After completion to avoid value resets changing the UI during nav (also if cancelled by a newer navigation)
			complete.then(
				() => leaveMultiplayer(),
				() => leaveMultiplayer(),
			); // The second arg here is the cancellation callback
		}
	});

	let showHomeButton = $derived(
		historyStack.length > 0 && new URL(historyStack.at(-1), page.url.origin).pathname !== "/",
	);
</script>

<nav class="menu-nav-bar safe-margin-top">
	<div class="navigation-button-container bar-menu">
		<button
			class="standard-button bright large"
			disabled={$matchmakingActive}
			onclick={() => {
				playSound("basic_button");
				goBack();
			}}
		>
			<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="back-button-arrow-icon" />
			Back</button
		>
	</div>
	{#if showHomeButton}
		<div class="navigation-button-container bar-menu">
			<button
				class="standard-button bright large"
				disabled={$matchmakingActive}
				onclick={() => {
					playSound("basic_button");
					goto("/");
				}}
			>
				<Home strokeWidth={2.25} style="margin-bottom: -4px" /></button
			>
		</div>
	{/if}
</nav>

<div class="background"></div>

<main class="content safe-margin-top">
	<div class="container">
		{@render children?.()}
	</div>
</main>

<style>
	.background {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--overlay-color-dark);
		z-index: 90;
		backdrop-filter: blur(var(--elevated-blur));
	}

	.navigation-button-container {
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		pointer-events: auto;
	}

	.back-button-arrow-icon {
		width: 25px;
		height: 25px;
		transform: rotate(90deg);
		vertical-align: -5px;
		user-select: none;
		pointer-events: none;
	}

	.menu-nav-bar {
		position: fixed;
		top: var(--layout-margin);
		left: var(--layout-margin);
		right: var(--layout-margin);
		display: flex;
		gap: var(--layout-margin);
		z-index: 99;
		pointer-events: none;
	}

	.content {
		overflow-x: hidden;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 91;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container {
		--menu-padding-top: 100px;
		max-width: 1100px;
		padding: var(--layout-margin);
		padding-top: var(--menu-padding-top);
		width: 100%;
	}

	@media (min-width: 800px) {
		.content {
			padding-inline: 130px; /* Padding rather than margin to allow touch scrolling on it */
		}
	}
</style>
