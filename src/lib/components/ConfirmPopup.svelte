<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import {
		confirmPopupVisible,
		confirmUsernameInput,
		confirmPasswordInput,
		confirmTitle,
		confirmDescription,
		confirmConfirmText,
		confirmExecuteFunction,
		confirmPasswordValue,
		confirmUsernameValue,
	} from "$lib/stores/context-specific/confirmPopupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import InfoBanner from "./InfoBanner.svelte";

	function confirm() {
		playSound("basic_button");
		confirmPopupVisible.set(false);
		try {
			get(confirmExecuteFunction)?.();
		} catch (error) {
			console.error("Error executing confirm callback:", error);
		}
	}
</script>

<Popup verySlim={true} bind:open={$confirmPopupVisible}>
	<div class="popup-title">
		<h1>{$confirmTitle}</h1>
	</div>
	<p class:popup-description-narrow={$confirmUsernameInput}>{$confirmDescription}</p>
	{#if $confirmPasswordInput}
		<InfoBanner style="margin-top: var(--layout-margin); margin-bottom: var(--layout-margin);">
			For accounts created without a password, please set one <a href="/signup?reset=true" target="_blank">here</a>.
		</InfoBanner>
		<input class="confirm-popup-input" type="password" placeholder="Password" bind:value={$confirmPasswordValue} />
	{/if}
	{#if $confirmUsernameInput}
		<input
			type="text"
			class="confirm-popup-input margin-top"
			placeholder="New name"
			maxlength="50"
			bind:value={$confirmUsernameValue}
		/>
	{/if}
	<div class="margin-top larger-spacing">
		{#if $confirmExecuteFunction}
			<button
				class="standard-button bottom-button large-button"
				onclick={confirm}
				disabled={($confirmUsernameInput && $confirmUsernameValue?.length < 1) ||
					($confirmPasswordInput && $confirmPasswordValue?.length < 1)}>{$confirmConfirmText}</button
			>
		{/if}
	</div>
</Popup>

<style>
	.confirm-popup-input {
		padding: var(--content-margin) var(--box-margin);
		width: 40%;
	}

	.margin-top {
		margin-top: var(--layout-margin);
	}

	.larger-spacing {
		gap: var(--layout-margin);
	}

	.popup-description-narrow {
		max-width: calc(100% - 150px);
	}

	@media (max-width: 600px) {
		.popup-description-narrow {
			max-width: none;
		}
	}
</style>
