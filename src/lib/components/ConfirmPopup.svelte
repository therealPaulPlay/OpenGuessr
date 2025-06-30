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

	function confirm() {
		playSound("basic_button");
		confirmPopupVisible.set(false);
		try {
			if (get(confirmExecuteFunction)) {
				get(confirmExecuteFunction)();
			}
		} catch (error) {
			console.error("Error executing confirm callback:", error);
		}
	}
</script>

<Popup verySlim={true} z={982} bind:open={$confirmPopupVisible}>
	<h1 class="popup-title">{$confirmTitle}</h1>
	<p class="popup-description">{$confirmDescription}</p>
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
	<div class="marginTop largerSpacing">
		{#if $confirmShowConfirm}
			<button class="standardButton largeButton" onclick={confirm} style:background-color={$confirmConfirmColor}
				>{$confirmConfirmText}</button
			>
		{/if}
	</div>
</Popup>

<style>
	.confirmPopupInput {
		padding: 5px 15px;
		width: 40%;
		margin-top: var(--layout-margin);
	}

	.marginTop {
		margin-top: var(--layout-margin);
	}

	.largerSpacing {
		gap: var(--layout-margin);
	}
</style>
