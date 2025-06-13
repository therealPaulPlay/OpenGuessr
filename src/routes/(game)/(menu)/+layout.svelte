<script>
	let { children } = $props();
	import { playSound } from "$lib/utils/soundManager";
	import Notification from "$lib/components/Notification.svelte";
	import { screenEscapeDisabled } from "$lib/stores/context-specific/multiplayerStore";
	import { leaveMultiplayerRound } from "$lib/logic/multiplayerLogic";
	import { goto } from "$app/navigation";
	import { Home } from "lucide-svelte";

	function goBack() {
		if (document.referrer) return window.history.back();
		window.location.href = "/"; // Fallback if no referrer
	}
</script>

<nav class="menuNavBar">
	<div class="centerNotifications">
		<Notification belowNavbar={false} />
	</div>
	<button
		class="backButton standardButton white"
		class:buttonDisabled={$screenEscapeDisabled}
		onclick={() => {
			playSound("basic_button");
			goBack();
			leaveMultiplayerRound();
		}}
	>
		<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="backButtonArrowIcon" />
		Back</button
	>
	<button
		class="backButton standardButton white"
		class:buttonDisabled={$screenEscapeDisabled}
		onclick={() => {
			playSound("basic_button");
			leaveMultiplayerRound();
			goto("/");
		}}
	>
		<span class="homeButtonIcon"><Home strokeWidth={2.25} /></span></button
	>
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

	.centerNotifications {
		width: 100%;
		display: flex;
		justify-content: center;
		position: absolute;
		display: flex;
	}

	.backButton {
		width: fit-content;
		height: 50px;
		border-radius: 10px;
		text-decoration: none;
		line-height: 35px;
		pointer-events: auto;
		backdrop-filter: blur(15px);
	}

	.homeButtonIcon {
		vertical-align: -6px;
	}

	.buttonDisabled {
		pointer-events: none !important;
		opacity: 0.5;
	}

	.backButtonArrowIcon {
		width: 25px;
		height: 25px;
		transform: rotate(90deg);
		vertical-align: -5px;
	}

	.menuNavBar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		padding: 20px;
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
		padding: 20px;
		padding-top: 100px;
		width: calc(100% - 40px);
	}
</style>
