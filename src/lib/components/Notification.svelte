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
	<div id="notificationBar" style:top={belowNavbar ? "80px" : "15px"} transition:fly={{ y: -20, duration: 250 }}>
		<p id="notificationText">{$notificationText}</p>
		<div class="notificationButtonBox">
			{#if $showAcceptButton}
				<button id="notificationAccept" class="standardButton white" onclick={accept}>{$acceptText}</button>
			{/if}
			<button id="notificationDismiss" class="standardButton white" onclick={dismiss}>
				<img alt="dismiss notification" class="dismissIcon" src="/img/delete_icon.png" />
			</button>
		</div>
	</div>
{/if}

<style>
	#notificationBar {
		position: fixed;
		top: 0;
		border-radius: 10px;
		background-color: var(--panel-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: white;
		padding: var(--panel-margin);
		gap: 15px;
		font-size: 22px;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
		transition: all 200ms ease;
		pointer-events: auto;
		margin-inline: 10px;
		max-width: 80vw;
		z-index: 999;
	}

	#notificationAccept {
		min-width: 45px;
	}

	#notificationDismiss,
	#notificationAccept {
		padding-inline: 10px;
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
