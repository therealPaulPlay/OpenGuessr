<script>
	import { slide } from "svelte/transition";

	let { red = false, text = "Default", italic = false, mutedOpacity = true, animate = false, children, class: classes } = $props();
</script>

{#if animate}
	<span
		class="chip {classes}"
		class:chip-red={red}
		class:chip-italic={italic}
		class:muted-opacity={mutedOpacity}
		transition:slide={{ axis: "x", duration: 100 }}
	>
		{#if !children || typeof children !== "function"}
			{text}
		{:else}
			{@render children()}
		{/if}
	</span>
{:else}
	<span
		class="chip {classes}"
		class:chip-red={red}
		class:chip-italic={italic}
		class:muted-opacity={mutedOpacity}
	>
		{#if !children || typeof children !== "function"}
			{text}
		{:else}
			{@render children()}
		{/if}
	</span>
{/if}

<style>
	.chip {
		line-height: normal;
		border-radius: var(--content-margin);
		background: var(--box-color);
		padding: 2px;
		padding-inline: var(--content-margin);
		box-shadow: var(--bulb-shadow);
		flex-shrink: 0;
		white-space: nowrap;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		width: fit-content;
	}

	.chip,
	:global(.chip *) {
		font-size: 18px;
	}

	:global(.chip.muted-opacity span, .chip.muted-opacity p) {
		opacity: 0.75;
	}

	:global(.chip.chip-red span, .chip.chip-red p) {
		opacity: 1;
	}

	.chip-red {
		background-color: rgb(224, 2, 2);
	}

	.chip-italic {
		font-style: italic;
		padding-inline: var(--panel-margin);
		padding-left: calc(var(--panel-margin) - 2px);
	}
</style>
