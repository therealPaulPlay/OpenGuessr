<!-- Captcha popup (currently using Cloudflare Turnstile) -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import { captchaPopupVisible } from "$lib/stores/context-specific/captchaPopupStore";
	import { Info } from "@lucide/svelte";

	$effect(() => {
		if ($captchaPopupVisible) {
			renderCaptcha("#captchaContainer", window.onTurnstileCallback);
		}
	});
</script>

<Popup verySlim={true} z={981} bind:open={$captchaPopupVisible}>
	<h1 class="popup-title">Captcha</h1>
	<div class="infoBox">
		<Info strokeWidth={2.25} size={24} color="white" style="opacity: 50%; margin-right: 10px;" />
		<p class="captchaInfoText">To protect against bot attacks, please solve this captcha.</p>
	</div>
	<br />
	<div id="captchaContainer" class="captchaMarginBottom" bind:this={captchaContainer}>
		<!-- the captcha will be loaded dynamically here -->
	</div>
</Popup>

<style>
	.captchaInfoText {
		opacity: 0.5;
	}

	.captchaMarginBottom {
		min-height: 75px;
	}

	.infoBox {
		padding: var(--box-margin);
		width: calc(100% - 20px);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		width: calc(100% - 30px);
		padding-inline: var(--layout-margin);
		display: flex;
		align-items: center;
		box-shadow: var(--box-shadow);
	}
</style>
