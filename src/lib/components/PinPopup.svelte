<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import PinHolder from "./PinHolder.svelte";
	import { pinPopup } from "$lib/stores/uiStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { purchasedPins } from "$lib/stores/accountStore";
</script>

<Popup z={971} verySlim={true} bind:open={$pinPopup}>
	<div class="popup-title">
		<h1>Pins</h1>
	</div>
	<TitleSeparator text="Progression" />
	<div class="pin-selector">
		<PinHolder pinId="0" pinLockText="0 XP" unlocked={$profileData?.experience >= 0} />
		<PinHolder pinId="1" pinLockText="5K XP" unlocked={$profileData?.experience >= 5000} />
		<PinHolder pinId="2" pinLockText="30K XP" unlocked={$profileData?.experience >= 30000} />
		<PinHolder pinId="3" pinLockText="100K XP" unlocked={$profileData?.experience >= 100000} />
		<PinHolder pinId="4" pinLockText="500K XP" unlocked={$profileData?.experience >= 500000} />
		<PinHolder pinId="5" pinLockText="5M XP" unlocked={$profileData?.experience >= 5000000} />
		<PinHolder pinId="6" pinLockText="10M XP" unlocked={$profileData?.experience >= 10000000} />
		<PinHolder pinId="7" pinLockText="75 Duel wins" unlocked={$profileData?.duelsWon >= 75} />
		<PinHolder pinId="8" pinLockText="50 Comp. entries" unlocked={$profileData?.competitionsEntered >= 50} />
		<PinHolder pinId="9" pinLockText="10 Count. streak" unlocked={$profileData?.highestCountryStreak >= 10} />
		<PinHolder pinId="10" pinLockText="250 Comp. entries" unlocked={$profileData?.competitionsEntered >= 250} />
		<PinHolder pinId="11" pinLockText="Supporter" unlocked={$profileData?.supporterLevel >= 1} />
	</div>
	<TitleSeparator text="Purchased" />
	<div class="pin-selector">
		{#if $purchasedPins?.length}
			{#each $purchasedPins as pinId}
				<PinHolder {pinId} unlocked={true} />
			{/each}
		{:else}
			<p class="no-purchased-pins">No purchased pins.</p>
		{/if}
	</div>
</Popup>

<style>
	.pin-selector {
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

	.no-purchased-pins {
		opacity: 0.5;
		margin-inline: auto;
	}
</style>
