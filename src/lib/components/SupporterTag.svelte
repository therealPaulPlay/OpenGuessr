<div class="supporterSpan">Supporter</div>

<style>
	.supporterSpan {
		border-radius: 5px;
		background: var(--supporter-green);
		padding-inline: 5px;
		font-size: 18px;
		margin-left: 3px;
		box-shadow: var(--bulb-shadow);
		position: relative;
		overflow: hidden;
		display: inline-flex;
	}

	.supporterSpan::before {
		animation: 4s supporterGlint 2s infinite;
		background: white;
		filter: blur(8px);
		content: "";
		position: absolute;
		width: 10px;
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
