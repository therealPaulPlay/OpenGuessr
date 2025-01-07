<script>
	import Popup from "$lib/components/Popup.svelte";
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
	<Popup verySlim="true" Z={982}>
		<h1 id="confirmTitle" class="popup-title">{$confirmTitle}</h1>
		<div id="confirmDescription" class="popup-description">{$confirmDescription}</div>
		{#if $confirmPasswordInput}
			<input
				id="accountDeletePassword"
				class="confirmPopupInput"
				type="password"
				placeholder="Password"
				bind:value={$confirmPasswordValue}
			/>
		{/if}
		{#if $confirmUsernameInput}
			<input
				type="text"
				id="usernameInput"
				class="confirmPopupInput"
				placeholder="New username"
				maxlength="50"
				bind:value={$confirmUsernameValue}
			/>
		{/if}
		<div class="buttonBoxRight">
			<button id="confirmCancel" class="standardButton white closeButton" onclick={closeConfirmPopup}>Close</button>
			{#if $confirmShowConfirm}
				<button
					id="confirmProceed"
					class="standardButton closeButton"
					onclick={confirm}
					style:background-color={$confirmConfirmColor}>{$confirmConfirmText}</button
				>
			{/if}
		</div>
	</Popup>
{/if}

<style>
	.confirmPopupInput {
		border-radius: 5px;
		font-size: 22px;
		padding: 5px 15px;
		font-family: Barlow;
		width: 40%;
		margin-top: 15px;
	}
</style>
