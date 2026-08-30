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
	import { showNotification } from "$lib/utils/notifications";
	import { browser } from "$app/environment";
	import { errorPopup } from "$lib/utils/errorHandling";

	let isCreatingRoom = $state(false);
	let isCurrentlyStarting = $state(false);

	const STYLE_TABS = ["Standard", "Duel"];
</script>

<svelte:head>
	<title>Host</title>
</svelte:head>

<div class="main-container">
	<div class="multiplayer-creation-area">
		{#if !$multiplayer && !isCreatingRoom}
			<div class="multiplayer-host-settings">
				<p>Rounds</p>
				<Ticker maximum={10} minimum={1} initialValue={3} bind:value={$roundAmount} />
			</div>
			<div class="multiplayer-host-settings">
				<p>Round length</p>
				<Ticker maximum={310} step={10} minimum={10} maximumValue={Infinity} maximumText="∞" note="sec" initialValue={60} bind:value={$roundLength} />
			</div>
			<div id="room-creation-modes" class="multiplayer-host-settings">
				<p>Restriction</p>
				<select
					class="standard-button white"
					bind:value={$multiplayerRestriction}
					onchange={() => {
						playSound("basic_button");
					}}
				>
					{#each Object.entries($restrictionNames) as [key, value]}
						<option value={key}>{value}</option>
					{/each}
				</select>
			</div>
			<div id="room-creation-teams" class="multiplayer-host-settings">
				<p>Teams</p>
				<div class="ticker">
					<Ticker maximum={5} minimumText="No" note="teams" initialValue={1} bind:value={$teamAmount} />
				</div>
			</div>
			<div id="room-creation-modes" class="multiplayer-host-settings">
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
			<div id="room-creation-map" class="multiplayer-host-settings">
				<p>Map</p>
				<div class="selected-map-field">
					<p id="multiplayer-map-display">
						{(() => {
							if (browser) return idToMapName(localStorage.getItem("selectedMap") || $defaultMap);
							else return "...";
						})()}
					</p>
					<button
						class="standard-button white"
						onclick={() => {
							playSound("basic_button");
							goto("/maps?return-to-multiplayer=true");
						}}><ArrowRightLeft size={17} strokeWidth={2} /></button
					>
				</div>
			</div>
			<!-- Create button -->
			<div class="multiplayer-host-submit-area bar-menu">
				<button
					id="multiplayer-host"
					class="standard-button large-button"
					onclick={async () => {
						isCreatingRoom = true;
						playSound("basic_button");

						// Check if map is invalid for multiplayer
						if (["Country Guessr", "Tutorial"].includes(localStorage.getItem("selectedMap"))) {
							showNotification("Map not supported in multiplayer.");
							isCreatingRoom = false;
							return;
						}

						multiplayerMap.set(localStorage.getItem("selectedMap") || $defaultMap);
						await createMultiplayerRoom();
						isCreatingRoom = false;
					}}>Create room</button
				>
			</div>
		{:else}
			<MultiplayerHostDisplay
				startDisabledCondition={$participantCount < get(teamAmount) || $participantCount <= 1 || isCurrentlyStarting}
				showOpenRoom={true}
				startFunction={async () => {
					isCurrentlyStarting = true;
					try {
						await get(socket)?.sendRequest("startRoom");
					} catch (error) {
						if (get(multiplayer)) errorPopup("Failed to start room", "Error occured starting the room.", error.message);
						console.error("Error starting room:", error);
					}
					isCurrentlyStarting = false;
				}}
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

	.multiplayer-creation-area {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
	}

	.multiplayer-host-settings {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		padding-left: var(--layout-margin);
		box-shadow: var(--panel-shadow);
		width: 100%;
		box-sizing: border-box;
	}

	.multiplayer-host-settings p {
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	#multiplayer-host {
		padding-inline: 20px;
	}

	.multiplayer-host-submit-area {
		box-shadow: var(--panel-shadow);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
	}

	.selected-map-field {
		display: flex;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		justify-content: left;
		padding: var(--panel-margin);
		width: fit-content;
		align-items: center;
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.selected-map-field p {
		margin-inline: var(--box-margin);
	}
</style>
