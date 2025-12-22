<script>
	import { fullscreenNavigation } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { EllipsisVertical, X } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { blur } from "svelte/transition";

	let showIntroductionNote = $state(true);

	function disableIntroductionNote() {
		showIntroductionNote = false;
	}
</script>

<!-- Menu -->
<nav class="menu-button-area barMenu">
	<button
		class="standardButton white menu-button"
		onclick={() => {
			disableIntroductionNote();
			$fullscreenNavigation = !$fullscreenNavigation;
			playSound("basic_button");
		}}
		><span class="menu-span">Menu</span>
		<EllipsisVertical size={22} />
	</button>
</nav>

{#if showIntroductionNote}
	<div class="tooltip menu-tooltip menu-button-area" transition:blur={{ duration: 250 }}>
		<div class="tooltip-arrow menu-tooltip-arrow" data-placement="bottom"></div>
		<button
			class="standardButton white tooltip-close-button"
			onclick={disableIntroductionNote}
		>
			<X size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
		</button>
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
		width: 200px;
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

	.menu-tooltip p,
	.menu-tooltip button {
		opacity: 0.75;
	}

	.menu-tooltip-arrow {
		right: 40px;
		top: -8px;
		width: 10px;
		height: 8px;
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

	@media (max-width: 1200px) {
		.menu-span {
			display: none;
		}
	}
</style>
