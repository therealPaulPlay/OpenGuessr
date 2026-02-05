<script>
	import { ArrowRightLeft } from "@lucide/svelte";
	import { get } from "svelte/store";
	import {
		hostStage,
		teamAmount,
		roundAmount,
		roundLength,
		socket,
		roomcode,
		multiplayerStyle,
		multiplayerRestriction,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { setupMultiplayerRoom } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import Ticker from "$lib/components/ui/Ticker.svelte";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { goto } from "$app/navigation";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";

	// Restriction toggle
	let restrictions = Object.keys($restrictionNames);
	let restrictionButtonText = $state($restrictionNames[restrictions[0]]);

	function toggleMultiplayerRestriction() {
		const currentRestrictionIndex =
			(restrictions.findIndex((e) => e == $multiplayerRestriction) + 1) % restrictions.length;
		multiplayerRestriction.set(restrictions[currentRestrictionIndex]);
		restrictionButtonText = $restrictionNames[$multiplayerRestriction];
	}
</script>

<svelte:head>
	<title>Host</title>
</svelte:head>

<div class="main-container">
	<div class="multiplayerCreationArea">
		{#if $hostStage == 1}
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Rounds</p>
				<Ticker limit={10} minimum={2} initialValue={3} bind:value={$roundAmount} />
			</div>
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Round length</p>
				<Ticker limit={300} step={10} minimum={10} note="sec" initialValue={60} bind:value={$roundLength} />
			</div>
			<div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
				<p>Restriction</p>
				<button
					class="standardButton white toggleSwitch"
					onclick={() => {
						playSound("basic_button");
						toggleMultiplayerRestriction();
					}}>{restrictionButtonText}</button
				>
			</div>
			<div id="roomCreationTeams" class="roomCreationModule multiplayerHostSettings">
				<p>Teams</p>
				<div class="ticker">
					<Ticker limit={5} lowerLimitText="No" note="teams" initialValue={1} bind:value={$teamAmount} />
				</div>
			</div>
			<div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
				<p>Style</p>
				<Tabs
					tabs={["Standard", "Duel"]}
					onchange={(selected, _index) => {
						playSound("basic_button");
						multiplayerStyle.set(selected.toLowerCase());
					}}
				/>
			</div>
			<div id="roomCreationMap" class="roomCreationModule multiplayerHostSettings">
				<p>Map</p>
				<div class="selectedMapField">
					<p id="multiplayerMapDisplay">
						{(() => {
							if (typeof window === "undefined") return "Loading...";
							const category = localStorage.getItem("selectedMap") || $defaultMap;
							return idToMapName(category);
						})()}
					</p>
					<button
						class="standardButton white"
						onclick={() => {
							playSound("basic_button");
							goto("/maps");
						}}><ArrowRightLeft size={17} strokeWidth={2} /></button
					>
				</div>
			</div>
			<!-- Create button -->
			<div class="multiplayerHostSubmitArea">
				<button
					id="multiplayerHost"
					class="standardButton largeButton"
					onclick={() => {
						playSound("basic_button");
						// Switch to stage 2 (host code area) if on stage 1 (after the create room function!!)
						setupMultiplayerRoom(get(roundAmount), get(roundLength));
						hostStage.set(2);
					}}>Create room</button
				>
			</div>
		{:else if $hostStage == 2}
			<MultiplayerHostDisplay />
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(100dvh - 120px);
	}

	.multiplayerCreationArea {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
		margin-top: auto;
		margin-bottom: auto;
	}

	.roomCreationModule {
		padding-top: 10px;
		padding-bottom: 10px;
		box-shadow: var(--box-shadow);
	}

	.multiplayerHostSettings {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		border-radius: 15px;
		padding: var(--box-margin);
		padding-top: 10px;
		width: calc(100% - var(--box-margin) * 2);
	}

	.toggleSwitch {
		min-width: 170px;
	}

	#multiplayerHost {
		padding-inline: 20px;
	}

	.multiplayerHostSubmitArea {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.selectedMapField {
		display: flex;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		justify-content: left;
		padding: var(--panel-margin);
		width: fit-content;
		align-items: center;
		margin-bottom: 10px;
		margin-top: 10px;
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.selectedMapField p {
		margin-inline: 10px;
	}
</style>
