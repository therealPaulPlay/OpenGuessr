<script>
	let { children } = $props();
	import { playSound } from "$lib/utils/soundManager";
	import { matchmakingActive } from "$lib/stores/context-specific/multiplayerStore";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { goto, afterNavigate } from "$app/navigation";
	import { Home } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { page } from "$app/state";

	let historyStack = $state([]);

	afterNavigate(({ type, from, to }) => {
		if (type === "popstate") {
			if (historyStack.length > 0) historyStack.pop();
		} else if (from?.url?.pathname && from.url.pathname !== to?.url?.pathname) {
			historyStack.push(from.url.pathname);
		}
	});

	function goBack() {
		if (historyStack.length > 0) history.back(); // Must use .back to work with snapshots
		else goto("/");
	}

	function leaveMultiplayerIfReturningFromMultiplayerPage() {
		if (page.url.pathname.startsWith("/multiplayer")) leaveMultiplayer();
	}

	let showHomeButton = $derived(historyStack.length > 0 && historyStack.at(-1) !== "/");
</script>

<nav class="menuNavBar">
	<div class="navigationButtonContainer barMenu">
		<button
			class="backButton standardButton white largeButton"
			disabled={$matchmakingActive}
			onclick={() => {
				playSound("basic_button");
				leaveMultiplayerIfReturningFromMultiplayerPage();
				goBack();
			}}
		>
			<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="backButtonArrowIcon" />
			Back</button
		>
	</div>
	{#if showHomeButton}
		<div class="navigationButtonContainer barMenu">
			<button
				class="backButton standardButton white largeButton"
				disabled={$matchmakingActive}
				onclick={() => {
					playSound("basic_button");
					leaveMultiplayerIfReturningFromMultiplayerPage();
					goto("/");
				}}
			>
				<Home strokeWidth={2.25} style="margin-bottom: -4px" /></button
			>
		</div>
	{/if}
</nav>

<div class="background"></div>

<main class="content">
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
		background: rgba(13, 15, 28, 0.9);
		z-index: 90;
		backdrop-filter: blur(15px);
	}

	.navigationButtonContainer {
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
	}

	.backButton {
		pointer-events: auto;
		backdrop-filter: blur(10px);
	}

	.backButtonArrowIcon {
		width: 25px;
		height: 25px;
		transform: rotate(90deg);
		vertical-align: -5px;
	}

	.menuNavBar {
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
		overflow-y: auto;
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
		max-width: 1100px;
		padding: var(--layout-margin);
		padding-top: 100px;
		box-sizing: border-box;
		width: 100%;
	}

	@media (min-width: 800px) {
		.content {
			margin-inline: 130px;
		}
	}
</style>
