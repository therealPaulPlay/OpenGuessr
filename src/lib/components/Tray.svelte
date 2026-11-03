<script>
	import { ChevronUp } from "@lucide/svelte";
	import { fly } from "svelte/transition";
	import { computePosition, shift, offset, autoUpdate } from "@floating-ui/dom";
	import { playSound } from "$lib/utils/soundManager";

	let { active = false, open = $bindable(false), children } = $props();

	let buttonEl = $state();
	let contentEl = $state();

	$effect(() => {
		if (!active) open = false;
	});

	function floating(node) {
		const style = getComputedStyle(document.documentElement);
		const layoutMargin = parseFloat(style.getPropertyValue("--layout-margin"));
		const boxMargin = parseFloat(style.getPropertyValue("--box-margin"));

		node.showPopover();
		return autoUpdate(buttonEl, node, async () => {
			const { x, y } = await computePosition(buttonEl, node, {
				placement: "top",
				middleware: [offset(layoutMargin), shift({ padding: boxMargin })],
			});
			Object.assign(node.style, { left: `${x}px`, top: `${y}px` });
		});
	}
</script>

<svelte:window
	onclick={(event) => {
		if (open && !buttonEl?.contains(event.target) && !contentEl?.contains(event.target)) open = false;
	}}
/>

{#if active}
	<button
		class="standard-button bright tray-button"
		bind:this={buttonEl}
		onclick={() => {
			playSound("toggle_button");
			open = !open;
		}}
	>
		<span class="tray-arrow" style:rotate={open ? "180deg" : "0deg"}>
			<ChevronUp size={20} strokeWidth={2.5} />
		</span>
	</button>
	{#if open}
		<div
			class="tray-content bar-menu"
			popover="manual"
			bind:this={contentEl}
			{@attach floating}
			transition:fly={{ y: 10, duration: 250 }}
		>
			{@render children?.()}
		</div>
	{/if}
{:else}
	<div style:display="contents">
		{@render children?.()}
	</div>
{/if}

<style>
	.tray-button {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.tray-arrow {
		display: flex;
		transition: rotate 250ms ease;
	}

	.tray-content {
		position: absolute;
		inset: auto;
		background-color: var(--box-color);
	}
</style>
