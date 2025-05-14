<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { guestName, guestNamePromise } from "$lib/stores/context-specific/multiplayerStore";
	import { guestNamePickerPopup } from "$lib/stores/uiStore";
	import { filterProfanity } from "$lib/utils/profanityCheck";
	import { onMount } from "svelte";

	function generateFunnyGuestName() {
		let animals = [
			"Giraffe",
			"Ape",
			"Sloth",
			"Penguin",
			"Kangaroo",
			"Panda",
			"Zebra",
			"Llama",
			"Hippo",
			"Parrot",
			"Cat",
			"Dog",
			"Slug",
			"Crow",
			"Elephant",
		];
		let randomAnimal = animals[Math.floor(Math.random() * animals.length)];
		guestName.set("Guest" + randomAnimal);
	}

	onMount(generateFunnyGuestName);
</script>

{#if $guestNamePickerPopup}
	<Popup verySlim={true} z={980}>
		<h1 class="popup-title">Pick a name</h1>
		<div class="popup-description">Please choose a temporary name for multiplayer.</div>
		<div class="fullWidth">
			<input type="text" class="namePopupInput" placeholder="Guest name" maxlength="30" bind:value={$guestName} />
		</div>
		<button
			class="standardButton closeButton"
			class:buttonDisabled={$guestName?.length < 3}
			onclick={async () => {
                $guestName = $guestName.trim();
                $guestName = await filterProfanity($guestName);
				$guestNamePickerPopup = false;
				$guestNamePromise?.();
                $guestNamePromise = true; // True means, that the popup won't show up again
			}}>Confirm</button
		>
	</Popup>
{/if}

<style>
	.namePopupInput {
		font-size: 22px;
		padding: 5px 15px;
		width: 40%;
		margin-top: var(--layout-margin);
	}

	.buttonDisabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.fullWidth {
		width: 100%;
	}
</style>
