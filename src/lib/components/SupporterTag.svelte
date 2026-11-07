<div class="supporter-span content-shadow">Supporter</div>

<style>
	.supporter-span {
		border-radius: var(--content-margin);
		background: var(--bright-green-color);
		padding-inline: var(--content-margin);
		font-size: 20px;
		margin-left: 3px;
		box-shadow: var(--bulb-shadow);
		position: relative;
		overflow: hidden;
		display: inline-flex;
		--content-shadow-color: color-mix(in hsl, var(--bright-green-color), black 20%);
	}

	.supporter-span::before {
		animation: 4s supporterGlint 2s infinite;
		background: white;
		filter: blur(var(--normal-blur));
		content: "";
		position: absolute;
		width: var(--box-margin);
		z-index: 1;
		height: 200%;
		top: -10px;
		left: 0;
		transform: rotate(30deg);
		pointer-events: none;
		margin-left: -25px;
	}

	@keyframes supporterGlint {
		0% {
			margin-left: -25px;
			visibility: visible;
		}

		40% {
			margin-left: calc(100% + 25px);
		}

		100% {
			margin-left: calc(100% + 25px);
		}
	}
</style>
