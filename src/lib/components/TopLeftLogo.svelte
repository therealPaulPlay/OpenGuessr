<div class="logoLeft">
	<img class="image" src="/img/openguessr.svg" alt="OpenGuessr logo - the free geography location-guessing game" />
</div>

<style>
	.logoLeft {
		position: fixed;
		top: 0;
		left: 0;
		padding-inline: 20px;
		z-index: 15;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.image {
		width: 200px;
		height: 80px;
		filter: drop-shadow(0 0 10px rgba(43, 43, 43, 0.25));
	}

	/* hide logo on screens that don't have room for it */
	@media (max-width: 800px) {
		.logoLeft {
			display: none;
		}
	}
</style>
