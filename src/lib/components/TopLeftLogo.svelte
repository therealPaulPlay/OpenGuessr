<div class="logoLeft">
	<img
		id="OpenGuessrIcon"
		src="/img/openguessr.svg"
		alt="OpenGuessr logo - the free geography location-guessing game"
	/>
</div>

<style>
	.logoLeft {
		position: fixed;
		top: 0;
		left: 0;
		height: 80px;
		padding-inline: 20px;
		z-index: 15;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	/* hide logo on screens that don't have room for it */
	@media (max-width: 925px) {
		.logoLeft {
			display: none;
		}
	}

	#OpenGuessrIcon {
		width: 200px;
		height: auto;
		filter: drop-shadow(0 0 10px rgba(43, 43, 43, 0.25));
		/* shadow for image. left, top, blur, color */
	}
</style>
