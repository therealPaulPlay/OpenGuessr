<script>
	import {
		hideDisableOption,
		reload,
		hideErrors,
		title,
		description,
		errorCode,
		popupOpen,
	} from "$lib/stores/context-specific/errorPopupStore";
	import Popup from "./ui/Popup.svelte";
	import { get } from "svelte/store"; // Import get from svelte/store
</script>

<Popup
	verySlim={true}
	bind:open={$popupOpen}
	onUserClose={() => {
		if (get(reload)) window.location.reload();
	}}
>
	<h1 class="popup-title">{$title}</h1>
	<div>
		<p class="slight-bottom-margin">{$description}</p>
		{#if $errorCode}
			<p class="error-code white-soft">{$errorCode}</p>
		{/if}
	</div>
	{#if !$hideDisableOption}
		<div id="error-popup-disable">
			<p>Never show again</p>
			<input type="checkbox" id="hide-errors" bind:checked={$hideErrors} />
		</div>
	{/if}
</Popup>

<style>
	.error-code {
		opacity: 70%;
		padding: var(--box-margin);
		padding-inline: 20px;
		border-radius: 7px;
		font-size: 14px;
		line-height: 22px;
		font-family: monospace;
		margin-top: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	#error-popup-disable {
		display: flex;
		vertical-align: center;
		margin-top: var(--layout-margin);
		font-size: 22px;
		opacity: 60%;
	}

	.slight-bottom-margin {
		margin-bottom: var(--layout-margin);
	}
</style>
