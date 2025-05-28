<script>
	import {
		notificationVisible,
		notificationText,
		acceptText,
		showAcceptButton,
		dismissFunction,
		acceptFunction,
	} from "$lib/stores/context-specific/notificationStore";
	import { hideNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";
	import { fly } from "svelte/transition";

	let { belowNavbar = true } = $props();

	function accept() {
		if ($acceptFunction) {
			try {
				$acceptFunction();
			} catch (error) {
				console.error("Error executing notification function:", error);
			}
		}

		playSound("basic_button");
		hideNotification();
	}

	function dismiss() {
		if ($dismissFunction) {
			try {
				$dismissFunction();
			} catch (error) {
				console.error("Error executing notification function:", error);
			}
		}

		playSound("basic_button");
		hideNotification();
	}
</script>

{#if $notificationVisible}
	<div
		id="notificationBar"
		class="barMenu"
		style:top={belowNavbar ? "80px" : "var(--layout-margin)"}
		transition:fly={{ y: -20, duration: 250 }}
	>
		<p id="notificationText">{$notificationText}</p>
		<div class="notificationButtonBox">
			{#if $showAcceptButton}
				<button id="notificationAccept" class="standardButton panelButton white" onclick={accept}>{$acceptText}</button>
			{/if}
			<button id="notificationDismiss" class="standardButton panelButton white" onclick={dismiss}>
				<img alt="dismiss notification" class="dismissIcon" src="/img/delete_icon.png" />
			</button>
		</div>
	</div>
{/if}

<style>
	#notificationBar {
		position: fixed;
		top: 0;
		gap: var(--layout-margin);
		transition: all 200ms ease;
		pointer-events: auto;
		max-width: 80vw;
		z-index: 100;
	}

	@media (max-width: 1200px) {
		#notificationBar {
			top: var(--box-margin) !important;
		}
	}

	.panelButton {
		background-color: var(--panel-button-color);
	}

	#notificationAccept {
		min-width: 45px;
		min-height: 40px;
	}

	#notificationDismiss,
	#notificationAccept {
		padding-inline: 10px;
		min-height: 40px;
	}

	#notificationText {
		padding-left: 10px;
		max-width: 350px;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.notificationButtonBox {
		display: flex;
		align-items: center;
		width: fit-content;
		gap: var(--panel-margin);
	}

	.dismissIcon {
		width: 25px;
		height: 25px;
		vertical-align: -4px;
	}
</style>
