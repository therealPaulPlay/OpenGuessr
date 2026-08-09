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
	import { Info } from "@lucide/svelte";
	import { get } from "svelte/store";

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

<Popup verySlim={true} z={982} bind:open={$confirmPopupVisible}>
	<div class="popup-title">
		<h1>{$confirmTitle}</h1>
	</div>
	<p class:popup-description-narrow={$confirmUsernameInput}>{$confirmDescription}</p>
	{#if $confirmPasswordInput}
		<div class="info-container">
			<Info
				strokeWidth={2.25}
				size={22}
				color="white"
				style="opacity: 50%; margin-right: var(--content-margin); margin-left: 2px; margin-bottom: -1px; flex-shrink: 0;"
			/>
			<p>
				For accounts created without a password, please set one <a href="/signup?reset=true" target="_blank">here</a>.
			</p>
		</div>
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

	.info-container {
		display: flex;
		padding: var(--box-margin);
		padding-right: var(--layout-margin);
		border-radius: var(--box-margin);
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: var(--content-margin);
		margin-top: var(--layout-margin);
		margin-bottom: var(--layout-margin);
		max-width: fit-content;
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
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
