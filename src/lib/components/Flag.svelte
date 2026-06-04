<script>
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import * as FlagIcons from "svelte-flag-icons";
	import { getCountryName } from "$lib/utils/getCountryName";

	let { code, size, showTooltip = true } = $props();

	// Falls back to the neutral placeholder for unknown codes
	const FlagIcon = $derived(FlagIcons[code] || FlagIcons.Xx);
</script>

{#if showTooltip}
	<FlagIcon {size} {@attach tooltip({ text: getCountryName(code) || "Unknown" })} />
{:else}
	<FlagIcon {size} />
{/if}
