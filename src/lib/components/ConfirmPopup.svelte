<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import {
		confirmPopupVisible,
		confirmUsernameInput,
		confirmPasswordInput,
		confirmTitle,
		confirmDescription,
		confirmConfirmText,
		confirmConfirmColor,
		confirmExecuteFunction,
		confirmShowConfirm,
		confirmPasswordValue,
		confirmUsernameValue,
	} from "$lib/stores/context-specific/confirmPopupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";

	function closeConfirmPopup() {
		playSound("basic_button");
		confirmPopupVisible.set(false);
	}

	function confirm() {
		closeConfirmPopup();
		try {
			if (get(confirmExecuteFunction)) {
				get(confirmExecuteFunction)();
			}
		} catch (error) {
			console.error("Error executing confirm callback:", error);
		}
	}
</script>

{#if $confirmPopupVisible}
	<Popup verySlim={true} z={982}>
		<h1 class="popup-title">{$confirmTitle}</h1>
		<div class="popup-description marginBottom">{$confirmDescription}</div>
		{#if $confirmPasswordInput}
			<input class="confirmPopupInput" type="password" placeholder="Your password" bind:value={$confirmPasswordValue} />
		{/if}
		{#if $confirmUsernameInput}
			<input
				type="text"
				class="confirmPopupInput"
				placeholder="New username"
				maxlength="50"
				bind:value={$confirmUsernameValue}
			/>
		{/if}
		<div class="buttonBoxRight marginTop">
			<button class="standardButton white closeButton" onclick={closeConfirmPopup}>Close</button>
			{#if $confirmShowConfirm}
				<button class="standardButton closeButton" onclick={confirm} style:background-color={$confirmConfirmColor}
					>{$confirmConfirmText}</button
				>
			{/if}
		</div>
	</Popup>
{/if}

<style>
	.confirmPopupInput {
		padding: 5px 15px;
		width: 40%;
		margin-top: var(--layout-margin);
	}

	.marginTop {
		margin-top: var(--layout-margin);
	}

	.marginBottom {
		margin-bottom: var(--box-margin);
	}
</style>
