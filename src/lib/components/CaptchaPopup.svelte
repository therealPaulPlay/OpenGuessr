<!-- Captcha popup (currently using Cloudflare Turnstile) -->
<script>
	import Popup from "$lib/components/Popup.svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import { captchaPopupVisible } from "$lib/stores/context-specific/captchaPopupStore";

	$effect(() => {
		if ($captchaPopupVisible) {
			renderCaptcha("#captchaContainer", window.onTurnstileCallback);
		}
	});
</script>

<div style:visibility={$captchaPopupVisible ? "visible" : "hidden"}>
	<Popup slim="true" z="981">
		<h1 class="popup-title">Captcha</h1>
		<div class="infoBox">
			<img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
			<p class="captchaInfoText">To protect against bot attacks, please solve this captcha.</p>
		</div>
		<br />
		<div id="captchaContainer" bind:this={captchaContainer}>
			<!-- the captcha will be loaded dynamically here -->
		</div>
		<div class="buttonBoxRight"></div>
	</Popup>
</div>

<style>
	.captchaInfoText {
		opacity: 0.5;
	}

	.infoBox {
		padding: 10px;
		width: calc(100% - 20px);
		border-radius: 10px;
		background-color: rgba(255, 255, 255, 0.1);
		width: calc(100% - 30px);
		padding-inline: 15px;
		display: flex;
	}
</style>
