<script>
	import { page } from "$app/state";
	import {
		notificationVisible,
		notificationText,
		viewOnly,
		dismissFunction,
		acceptFunction,
		clickableText,
		textClickFunction,
	} from "$lib/stores/context-specific/notificationStore";
	import { hideNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";
	import { Check, SquareArrowOutUpRight, X } from "@lucide/svelte";
	import { fly } from "svelte/transition";

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

	let notificationTextArray = $derived($clickableText ? $notificationText?.split("%s") : [$notificationText]);
</script>

<div class="notification-holder" style:top={page.url.pathname === "/" ? "var(--box-margin)" : "var(--layout-margin)"}>
	{#if $notificationVisible}
		<div id="notification-bar" class="bar-menu" transition:fly={{ y: -20, duration: 250 }}>
			<p id="notification-text">
				{#each notificationTextArray, index}
					{notificationTextArray[index]}
					{#if notificationTextArray.length > index + 1}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span class="clickable-text" onclick={$textClickFunction} role="button" tabindex="0">{$clickableText}</span>
					{/if}
				{/each}
			</p>
			<div class="notification-button-box">
				{#if $acceptFunction}
					<button
						id="notification-accept"
						class="standard-button white"
						onclick={accept}
						aria-label={$viewOnly ? "View" : "Accept"}
					>
						{#if $viewOnly}
							<SquareArrowOutUpRight size={20} strokeWidth={2.25} style="vertical-align: -1px;" />
						{:else}
							<Check size={20} strokeWidth={2.25} style="vertical-align: -1px;" />
						{/if}
					</button>
				{/if}
				<button id="notification-dismiss" class="standard-button white" onclick={dismiss} aria-label="Dismiss">
					<X size={20} strokeWidth={2.25} style="vertical-align: -1px;" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	#notification-bar {
		gap: var(--layout-margin);
		transition: all 200ms ease;
		pointer-events: auto;
		max-width: 80%;
		margin-inline: auto;
	}

	.clickable-text {
		cursor: pointer;
		transition: opacity 250ms ease;
	}

	.clickable-text:hover {
		opacity: 0.5;
	}

	.notification-holder {
		position: fixed;
		left: var(--box-margin);
		right: var(--box-margin);
		display: flex;
		justify-content: center;
		pointer-events: none;
		z-index: 999;
		transition: top 250ms ease;
	}

	@media (max-width: 1200px) {
		#notification-bar {
			top: var(--box-margin) !important;
		}
	}

	#notification-dismiss,
	#notification-accept {
		padding-inline: var(--box-margin);
	}

	#notification-text {
		padding-left: var(--panel-margin);
		max-width: 350px;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.notification-button-box {
		display: flex;
		align-items: center;
		width: fit-content;
		gap: var(--panel-margin);
	}
</style>
