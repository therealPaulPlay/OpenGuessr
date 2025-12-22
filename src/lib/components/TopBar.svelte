<script>
	import { navigationMenu } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { EllipsisVertical, X } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { blur } from "svelte/transition";
	import { onMount } from "svelte";

	let showIntroductionNote = $state(false);

	onMount(() => {
		const showIntroduction = localStorage.getItem("menuIntroduction") == null;
		if (showIntroduction && !window.matchMedia("(max-width: 800px) and (orientation: portrait)").matches) showIntroductionNote = true;
	});

	function disableIntroductionNote() {
		showIntroductionNote = false;
		localStorage.setItem("menuIntroduction", true);
	}
</script>

<!-- Menu -->
<nav class="menu-button-area barMenu">
	<button
		class="standardButton white menu-button"
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
	<div class="tooltip menu-tooltip menu-button-area" transition:blur={{ duration: 250 }}>
		<div class="tooltip-arrow menu-tooltip-arrow" data-placement="bottom"></div>
		<button class="standardButton white tooltip-close-button" onclick={disableIntroductionNote}>
			<X size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
		</button>
		<img alt="Menu introcution" src="/img/menu_introduction.png" class="menu-tooltip-image" />
		<p>Discover multiplayer, competitions, and maps!</p>
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
		gap: var(--box-margin);
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
	}

	.menu-tooltip p {
		margin-left: 5px;
		margin-bottom: 5px;
	}

	.menu-tooltip button {
		opacity: 0.75;
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

	@media (max-width: 800px) and (orientation: portrait) {
		.menu-span {
			display: none;
		}
	}
</style>
