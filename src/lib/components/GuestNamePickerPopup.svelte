<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { guestName, guestNamePromise } from "$lib/stores/context-specific/multiplayerStore";
	import { guestNamePickerPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { censor } from "fast-profanity-filter";

	function generateFunnyGuestName() {
		generatedName = true;
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

	let generatedName = false;

	guestNamePickerPopup.subscribe((value) => {
		if (value && !generatedName) generateFunnyGuestName();
	});

	async function setName() {
		$guestName = $guestName.trim();
		$guestName = censor($guestName);
		$guestNamePromise?.();
		$guestNamePromise = true; // True means, that the popup won't show up again
	}
</script>

<Popup
	verySlim={true}
	z={980}
	bind:open={$guestNamePickerPopup}
	onclose={() => {
		$guestNamePromise = null;
		leaveMultiplayer();
		if (page.url.pathname.startsWith("/multiplayer/")) goto("/multiplayer"); // If on host or other multiplayer child page, return to multiplayer home
	}}
>
	<div class="popup-title">
		<h1>Pick a name</h1>
	</div>
	<p class="popup-description">Please choose a temporary name for multiplayer.</p>
	<div class="fullWidth">
		<input type="text" class="namePopupInput" placeholder="Guest name" maxlength="30" bind:value={$guestName} />
	</div>
	<button
		class="standardButton bottomButton largeButton"
		disabled={$guestName?.length < 3}
		onclick={async () => {
			playSound("basic_button");
			await setName();
			$guestNamePickerPopup = false;
		}}>Confirm</button
	>
</Popup>

<style>
	.namePopupInput {
		font-size: 22px;
		padding: var(--content-margin) 15px;
		width: 40%;
		margin-top: var(--layout-margin);
	}

	.fullWidth {
		width: 100%;
	}
</style>
