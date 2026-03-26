<!-- Universal Popup component, used as the "enclosure" for (basically) all Popups -->

<script>
	import { X } from "@lucide/svelte";
	import { backOut } from "svelte/easing";
	import { fade, scale } from "svelte/transition";

	let { children, z = 100, frameless, slim, verySlim, open = $bindable(false), onclose } = $props();

	function close() {
		onclose?.();
		open = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key == "Escape") open = false;
	}}
/>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="popupHolder"
		style:z-index={z}
		transition:fade={{ duration: 100 }}
		onclick={(e) => {
			if (e.target == e.currentTarget) close();
		}}
		role="dialog"
		tabindex={0}
	>
		<div
			class="uiWindow"
			transition:scale={{ easing: backOut, duration: 250, start: 0.9 }}
			class:frameLess={frameless}
			style:max-width={verySlim ? "600px" : slim ? "750px" : "850px"}
		>
			<button class="closePopupButton standardButton white" aria-label="close" onclick={close}
				><X strokeWidth={2.25} /></button
			>
			<div class="content of-top of-bottom" class:content-frameless={frameless}>
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.popupHolder {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--dark-background);
		pointer-events: auto;
		backdrop-filter: blur(5px);
	}

	.closePopupButton {
		border-radius: var(--box-margin);
		background-color: var(--panel-color-soft);
		position: absolute;
		top: var(--layout-margin);
		right: var(--layout-margin);
		padding: var(--content-margin);
		z-index: 10;
	}

	.frameLess {
		padding: var(--content-margin) !important;
	}

	.content {
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
		max-height: min(900px, calc(100dvh - var(--layout-margin) * 2 - 50px));
		width: 100%;
	}

	.content-frameless {
		max-height: calc(100dvh - var(--layout-margin) * 2 - var(--box-margin) - 10px);
		margin-bottom: -4px;
	}

	.uiWindow {
		width: calc(100% - var(--layout-margin) * 2);
		box-sizing: border-box;
		padding: calc(var(--layout-margin) + 5px);
		border-radius: calc(var(--layout-margin) + var(--box-margin));
		text-align: left;
		position: relative;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		box-shadow:
			0 2px 100px rgba(5, 6, 10, 0.5),
			inset 0 0.05rem 1px hsla(0, 0%, 100%, 0.2),
			inset 0 -0.2rem 1px rgba(0, 0, 2, 0.2) !important;
		color: white;
		pointer-events: auto;
		transition:
			opacity 250ms ease,
			transform 250ms ease;
	}
</style>
