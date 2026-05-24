<!-- Red Vignette, shown when the timer runs low -->
<script>
	import { littleTimeVignetteVisible } from "$lib/stores/uiStore";
	import { fade } from "svelte/transition";
</script>

{#if $littleTimeVignetteVisible}
	<div class="littleTimeVignette" transition:fade={{ duration: 500 }}></div>
{/if}

<style>
	.littleTimeVignette {
		position: fixed;
		overflow: hidden;
		z-index: 1;
		box-shadow: 0 0 350px rgba(254, 0, 0, 0.5) inset;
		pointer-events: none;
		inset: 0 0 0 0; /* Top, right, bottom, left */
	}
</style>
