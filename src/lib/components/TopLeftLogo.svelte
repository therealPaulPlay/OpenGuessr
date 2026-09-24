<script>
	import { blur } from "svelte/transition";
</script>

<div class="logo" transition:blur={{ duration: 250 }}>
	<img class="image" src="/img/openguessr.svg" alt="OpenGuessr logo - the free geography location-guessing game" />
</div>

<style>
	.logo {
		position: fixed;
		top: 0;
		left: 0;
		padding: calc(var(--layout-margin) + 5px);
		z-index: 13;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		user-select: none;
	}

	.image {
		width: 165px;
		height: 35px;
		filter: drop-shadow(0 0 5px var(--dark-shadow-color));
	}

	/* hide logo on screens that don't have room for it */
	@media (orientation: portrait) and (max-width: 800px) {
		.logo {
			display: none;
		}
	}
</style>
