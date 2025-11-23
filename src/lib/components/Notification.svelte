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
			{#if $acceptFunction}
				<button id="notificationAccept" class="standardButton white" onclick={accept}>{$acceptText}</button>
			{/if}
			<button id="notificationDismiss" class="standardButton white" onclick={dismiss}>
				<X size={20} strokeWidth={2.5} style="vertical-align: -1px;" />
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
		z-index: 100;
		max-width: 80%;
		margin-inline: auto;
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
