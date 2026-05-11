<script>
	import { ArrowRightLeft } from "@lucide/svelte";
	import { get } from "svelte/store";
	import {
		teamAmount,
		roundAmount,
		roundLength,
		socket,
		multiplayerStyle,
		multiplayerRestriction,
		multiplayerMap,
		participantCount,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { createMultiplayerRoom } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import Ticker from "$lib/components/ui/Ticker.svelte";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { goto } from "$app/navigation";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";
	import { multiplayer } from "$lib/stores/modeStore";

	// Restriction toggle
	let restrictions = Object.keys($restrictionNames);
	let restrictionButtonText = $derived($restrictionNames[$multiplayerRestriction]);

	function toggleMultiplayerRestriction() {
		const currentRestrictionIndex =
			(restrictions.findIndex((e) => e == $multiplayerRestriction) + 1) % restrictions.length;
		multiplayerRestriction.set(restrictions[currentRestrictionIndex]);
	}

	// Creation state
	let isCreatingRoom = $state(false);

	const STYLE_TABS = ["Standard", "Duel"];
</script>

<svelte:head>
	<title>Host</title>
</svelte:head>

<div class="main-container">
	<div class="multiplayerCreationArea">
		{#if !$multiplayer && !isCreatingRoom}
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Rounds</p>
				<Ticker maximum={10} minimum={2} initialValue={3} bind:value={$roundAmount} />
			</div>
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Round length</p>
				<Ticker maximum={300} step={10} minimum={10} note="sec" initialValue={60} bind:value={$roundLength} />
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
					<Ticker maximum={5} minimumText="No" note="teams" initialValue={1} bind:value={$teamAmount} />
				</div>
			</div>
			<div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
				<p>Style</p>
				<Tabs
					tabs={STYLE_TABS}
					selectedIndex={STYLE_TABS.findIndex((e) => e.toLowerCase() === $multiplayerStyle) ?? 0}
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
							return idToMapName(localStorage.getItem("selectedMap") || $defaultMap);
						})()}
					</p>
					<button
						class="standardButton white"
						onclick={() => {
							playSound("basic_button");
							goto("/maps?return-to-multiplayer=true");
						}}><ArrowRightLeft size={17} strokeWidth={2} /></button
					>
				</div>
			</div>
			<!-- Create button -->
			<div class="multiplayerHostSubmitArea barMenu">
				<button
					id="multiplayerHost"
					class="standardButton largeButton"
					onclick={async () => {
						isCreatingRoom = true;
						playSound("basic_button");
						// Switch to stage 2 (host code area) if on stage 1 (after the setup room function!)
						multiplayerMap.set(localStorage.getItem("selectedMap") || $defaultMap);
						await createMultiplayerRoom();
						isCreatingRoom = false;
					}}>Create room</button
				>
			</div>
		{:else}
			<MultiplayerHostDisplay
				startDisabledCondition={$participantCount < get(teamAmount) || $participantCount <= 1}
				showOpenRoom={true}
				startFunction={() => get(socket)?.sendRequest("startRoom")}
			/>
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100dvh - 120px);
	}

	.multiplayerCreationArea {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
	}

	.roomCreationModule {
		padding-top: var(--box-margin);
		padding-bottom: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	.multiplayerHostSettings {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		padding-top: var(--box-margin);
		width: calc(100% - var(--box-margin) * 2);
	}

	.toggleSwitch {
		min-width: 170px;
	}

	#multiplayerHost {
		padding-inline: 20px;
	}

	.multiplayerHostSubmitArea {
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
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
		margin-bottom: var(--box-margin);
		margin-top: var(--box-margin);
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.selectedMapField p {
		margin-inline: var(--box-margin);
	}
</style>
