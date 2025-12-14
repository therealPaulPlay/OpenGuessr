<div class="logo">
	<img class="image" src="/img/openguessr.svg" alt="OpenGuessr logo - the free geography location-guessing game" />
</div>

<style>
	.logo {
		position: fixed;
		top: 0;
		left: 0;
		padding-inline: 20px;
		z-index: 13;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		user-select: none;
	}

	.image {
		width: 165px;
		height: 80px;
		filter: drop-shadow(0 0 10px rgba(43, 43, 43, 0.25));
	}

	/* hide logo on screens that don't have room for it */
	@media (max-width: 800px) {
		.logo {
			display: none;
		}
	}
</style>
