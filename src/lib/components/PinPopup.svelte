<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import PinHolder from "./PinHolder.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { pinPopup } from "$lib/stores/uiStore";
	import { profileData, profileExperience, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { purchasedPins } from "$lib/stores/accountStore";
</script>

<Popup z={971} verySlim={true} bind:open={$pinPopup}>
	<div class="popup-title">
		<h1 id="pinPopupWindow">Pins</h1>
	</div>
	<TitleSeparator text="Progression" />
	<div class="pinSelector">
		<PinHolder pinId="0" pinLockText="0 XP" unlocked={$profileExperience >= 0} />
		<PinHolder pinId="1" pinLockText="5,000 XP" unlocked={$profileExperience >= 5000} />
		<PinHolder pinId="2" pinLockText="30,000 XP" unlocked={$profileExperience >= 30000} />
		<PinHolder pinId="3" pinLockText="100,000 XP" unlocked={$profileExperience >= 100000} />
		<PinHolder pinId="4" pinLockText="500,000 XP" unlocked={$profileExperience >= 500000} />
		<PinHolder pinId="5" pinLockText="5,000,000 XP" unlocked={$profileExperience >= 5000000} />
		<PinHolder pinId="6" pinLockText="10,000,000 XP" unlocked={$profileExperience >= 10000000} />
		<PinHolder pinId="7" pinLockText="75 Duel Wins" unlocked={$profileData?.duelsWon >= 75} />
		<PinHolder pinId="8" pinLockText="50 Comp. Entries" unlocked={$profileData?.competitionsEntered >= 50} />
		<PinHolder pinId="9" pinLockText="10 Streak" unlocked={$profileData?.highestCountryStreak >= 10} />
		<PinHolder pinId="10" pinLockText="250 Comp. Entries" unlocked={$profileData?.competitionsEntered >= 250} />
		<PinHolder pinId="11" pinLockText="Supporter" unlocked={$profileSupporterLevel >= 1} />
	</div>
	<TitleSeparator text="Purchased" />
	<div class="pinSelector">
		{#if $purchasedPins?.length}
			{#each $purchasedPins as pinId}
				<PinHolder {pinId} unlocked={true} />
			{/each}
		{:else}
			<p class="noPurchasedPins">No purchased pins.</p>
		{/if}
	</div>
</Popup>

<style>
	.pinSelector {
		max-width: 100%;
		width: 100%;
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		gap: var(--box-margin);
		padding: var(--box-margin);
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
	}

	.noPurchasedPins {
		opacity: 0.5;
		margin-inline: auto;
	}
</style>
