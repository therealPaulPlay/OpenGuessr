<script>
	import {
		hideDisableOption,
		reload,
		hideErrors,
		title,
		description,
		errorCode,
		popupOpen,
		closeButtonText,
	} from "$lib/stores/context-specific/errorPopupStore";
	import { playSound } from "$lib/utils/soundManager";
	import Popup from "./ui/Popup.svelte";
	import { get } from "svelte/store"; // Import get from svelte/store
</script>

{#if $popupOpen}
	<Popup z={999} verySlim={true}>
		<h1 class="popup-title">{$title}</h1>
		<div>
			<p class="slightBottomMargin">{$description}</p>
			{#if $errorCode}
				<p class="errorCode">{$errorCode}</p>
			{/if}
		</div>
		{#if !$hideDisableOption}
			<div id="errorPopupDisable">
				<p>Never show again:</p>
				<input type="checkbox" id="hideErrors" bind:checked={$hideErrors} />
			</div>
		{/if}
		<button
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				popupOpen.set(false);

				if (get(reload)) {
					localStorage.setItem("selectedCategory", "standard");
					window.location.reload();
				}
			}}>{$closeButtonText}</button
		>
	</Popup>
{/if}

<style>
	.errorCode {
		opacity: 70%;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 10px;
		padding-inline: 20px;
		border-radius: 7px;
		font-size: 14px;
		line-height: 22px;
		font-family: monospace;
		margin-top: 10px;
	}

	#errorPopupDisable {
		display: flex;
		vertical-align: center;
		margin-top: 20px;
		font-size: 22px;
		opacity: 60%;
	}
</style>
