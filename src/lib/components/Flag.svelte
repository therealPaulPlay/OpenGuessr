<script>
	import { tooltip } from "openguessr-ui";
	import * as FlagIcons from "svelte-flag-icons";
	import { getCountryName } from "$lib/utils/getCountryName";

	let { code, size, showTooltip = true } = $props();

	// Falls back to the neutral placeholder for unknown codes
	const FlagIcon = $derived(FlagIcons[code] || FlagIcons.Xx);
</script>

{#if showTooltip}
	<span
		class="flag-icon"
		style:width={size ? `${size}px` : null}
		{@attach tooltip({ text: getCountryName(code) || "Unknown" })}
	>
		<FlagIcon />
	</span>
{:else}
	<span class="flag-icon" style:width={size ? `${size}px` : null}>
		<FlagIcon />
	</span>
{/if}

<style>
	.flag-icon {
		display: inline-flex;
		flex-shrink: 0;
		width: 24px;
		aspect-ratio: 4 / 3;
		border-radius: 3px;
		overflow: hidden;
	}

	.flag-icon :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
