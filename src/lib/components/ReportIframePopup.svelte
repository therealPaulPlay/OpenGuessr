<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { reportPopup } from "$lib/stores/uiStore";
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import { reportUserId } from "$lib/stores/context-specific/reportPopupStore";
	import { playSound } from "$lib/utils/soundManager";

	let link = $derived(
		`https://openreport.dev/report?type=user&reference-id=user-${$reportUserId}&key=838c115d03441bbdbc2b5fbdccaf2d4b&link=https%3A%2F%2Fopenguessr.com%3Fprofile-id%3D${$reportUserId}&reasons=Misconduct%2CCheating%2CGoogling`,
	);
</script>

{#if $reportPopup}
	<Popup z={971} verySlim={true}>
		<div id="browserIframeHolder">
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
		</div>
		<button
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				reportPopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	#browserIframeHolder {
		width: 100%;
		height: calc(100dvh - 250px);
		max-height: 600px;
		flex-grow: 1;
		background-color: rgba(0, 0, 0, 0.2);
		position: relative;
		border-radius: 5px;
	}

	#pageBrowserLoading {
		margin: 0;
		opacity: 0.15;
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
		height: 100%;
		overflow: hidden;
		background: transparent;
		outline: 5px solid rgba(75, 75, 75, 0.25);
		border-radius: 5px;
		position: relative;
		z-index: 2;
	}
</style>
