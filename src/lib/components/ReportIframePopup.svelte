<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { reportPopup } from "$lib/stores/uiStore";
	import { reportUserId } from "$lib/stores/context-specific/reportPopupStore";
	import { playSound } from "$lib/utils/soundManager";

	let link = $derived(
		`https://openreport.dev/report?type=user&reference-id=user-${$reportUserId}&key=838c115d03441bbdbc2b5fbdccaf2d4b&link=https%3A%2F%2Fopenguessr.com%3Fprofile-id%3D${$reportUserId}&reasons=Misconduct%2CCheating%2CGoogling`,
	);
</script>

<Popup z={971} verySlim={true} bind:open={$reportPopup} frameless={true}>
	<div class="absoluteCenter">
		<img src="/img/compass_spinner.png" alt="Loading iframe" class="spinner" id="pageBrowserLoading" />
	</div>
	<!-- svelte-ignore a11y_missing_attribute -->
	<iframe
		id="pageBrowserIframe"
		allowtransparency="true"
		frameborder="0"
		referrerpolicy="no-referrer-when-downgrade"
		src={link}
	></iframe>
</Popup>

<style>
	#pageBrowserLoading {
		margin: 0;
		opacity: 0.25;
	}

	.absoluteCenter {
		position: absolute;
		top: 50%;
		left: 50%;
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	#pageBrowserIframe {
		width: 100%;
		height: min(600px, calc(100dvh - 75px));
		background: transparent;
		border-radius: 12px;
		position: relative;
		z-index: 2;
	}
</style>
