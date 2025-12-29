<script>
	import {
		notificationVisible,
		notificationText,
		acceptText,
		dismissFunction,
		acceptFunction,
	} from "$lib/stores/context-specific/notificationStore";
	import { hideNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";
	import { X } from "@lucide/svelte";
	import { fly } from "svelte/transition";

	let { inMenu = false } = $props();

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

<div class="notification-holder" style:top={inMenu ? "var(--layout-margin)" : ""}>
	{#if $notificationVisible}
		<div id="notificationBar" class="barMenu" transition:fly={{ y: -20, duration: 250 }}>
			<p id="notificationText">{$notificationText}</p>
			<div class="notificationButtonBox">
				{#if $acceptFunction}
					<button id="notificationAccept" class="standardButton white" onclick={accept}>{$acceptText}</button>
				{/if}
				<button id="notificationDismiss" class="standardButton white" onclick={dismiss}>
					<X size={20} strokeWidth={2.5} style="vertical-align: -1px;" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	#notificationBar {
		gap: var(--layout-margin);
		transition: all 200ms ease;
		pointer-events: auto;
		z-index: 100;
		max-width: 80%;
		margin-inline: auto;
	}

	.notification-holder {
		position: fixed;
		top: var(--box-margin);
		left: var(--box-margin);
		right: var(--box-margin);
		display: flex;
		justify-content: center;
		pointer-events: none;
		z-index: 16;
	}

	@media (max-width: 1200px) {
		#notificationBar {
			top: var(--box-margin) !important;
		}
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
</style>
