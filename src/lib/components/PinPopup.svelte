<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import PinHolder from "./PinHolder.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { pinPopup } from "$lib/stores/uiStore";
	import { profileData, profileExperience, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
</script>

{#if $pinPopup}
	<Popup z={971} verySlim={true}>
		<div class="popup-title">
			<h1 id="pinPopupWindow">Pins</h1>
		</div>
		<div id="pinSelector">
			<PinHolder pinId="0" pinLockText="0 XP" unlocked={$profileExperience >= 0} />
			<PinHolder pinId="1" pinLockText="5,000 XP" unlocked={$profileExperience >= 5000} />
			<PinHolder pinId="2" pinLockText="30,000 XP" unlocked={$profileExperience >= 30000} />
			<PinHolder pinId="3" pinLockText="100,000 XP" unlocked={$profileExperience >= 100000} />
			<PinHolder pinId="4" pinLockText="500,000 XP" unlocked={$profileExperience >= 500000} />
			<PinHolder pinId="5" pinLockText="5,000,000 XP" unlocked={$profileExperience >= 5000000} />
			<PinHolder pinId="6" pinLockText="10,000,000 XP" unlocked={$profileExperience >= 10000000} />
			<PinHolder pinId="7" pinLockText="75 Duel Wins" unlocked={$profileData?.duelsWon >= 75} />
			<PinHolder pinId="8" pinLockText="50 Comp. Entries" unlocked={$profileData?.competitionsPlayed >= 50} />
			<PinHolder pinId="9" pinLockText="10 Streak" unlocked={$profileData?.highestStreak >= 10} />
			<PinHolder pinId="10" pinLockText="250 Comp. Entries" unlocked={$profileData?.competitionsPlayed >= 250} />
			<PinHolder pinId="11" pinLockText="Supporter" unlocked={$profileSupporterLevel >= 1} />
		</div>
		<button
			id="pinClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				pinPopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	#pinSelector {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		max-width: 100%;
		width: fit-content;
		background-color: var(--box-color-dark);
		border-radius: 10px;
		gap: var(--box-margin);
		border: solid var(--box-margin) transparent;
		box-sizing: border-box;
		flex-wrap: wrap;
	}
</style>
