<script>
	import { fadePanorama } from "$lib/stores/context-specific/restrictionStore";
</script>

{#if $fadePanorama}
	<div class="fade-background"></div>
{/if}

<style>
	.fade-background {
		position: fixed;
		overflow: hidden;
		width: 100%;
		height: 100%;
		z-index: 1;
		animation: restrictionFade 3s infinite;
		transition: oapcity 1000ms ease;
		pointer-events: none;
		top: 0;
		background-color: black;
	}

	@keyframes restrictionFade {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0;
		}
	}
</style>
