<script>
	import { supporterWindowIfAuthenticated } from "$lib/utils/showSupporterPopup";
	let { text } = $props();
</script>

<p class="adsTextResult noAdvertsText">
	{text}
</p>

<style>
	.adsTextResult {
		outline: none;
		background-color: transparent;
		opacity: 0.5 !important;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
	}

	.noAdvertsText {
		text-align: center;
		color: white;
		opacity: 0.25;
		font-size: 22px;
		overflow: hidden;
		transition: opacity 500ms ease;
		border-radius: 7px;
	}
</style>
