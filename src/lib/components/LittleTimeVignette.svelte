<!-- Red Vignette, shown when the timer runs low -->
<script>
	import { littleTimeVignette } from "$lib/stores/uiStore";
</script>

<div class="littleTimeVignette" style:opacity={$littleTimeVignette ? "1" : "0"}></div>

<style>
	.littleTimeVignette {
		position: fixed;
		overflow: hidden;
		z-index: 1;
		box-shadow: 0 0 350px rgba(254, 0, 0, 0.5) inset;
		pointer-events: none;
		transition: opacity 500ms ease;
		inset: 0 0 0 0; /* Top, right, bottom, left */
	}
</style>
