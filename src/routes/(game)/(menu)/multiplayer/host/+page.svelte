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
	import { Ticker, Tabs, showErrorPopup } from "openguessr-ui";
	import { goto } from "$app/navigation";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";
	import { multiplayer } from "$lib/stores/modeStore";

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
				<Ticker
					maximum={10}
					minimum={1}
					initialValue={$roundAmount}
					minValueWidth="40px"
					bind:value={$roundAmount}
					onchange={() => playSound("change_value")}
				/>
			</div>
			<div class="multiplayer-host-settings">
				<p>Round length</p>
				<Ticker
					maximum={310}
					step={10}
					minimum={10}
					maximumValue={Infinity}
					maximumText="∞"
					note="sec"
					initialValue={$roundLength === Infinity ? 310 : $roundLength}
					minValueWidth="50px"
					bind:value={$roundLength}
					onchange={() => playSound("change_value")}
				/>
			</div>
			<div id="room-creation-modes" class="multiplayer-host-settings">
				<p>Restriction</p>
				<select
					class="standard-button bright"
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
				<Ticker
					maximum={5}
					minimumText="No"
					note="teams"
					initialValue={$teamAmount}
					minValueWidth="45px"
					bind:value={$teamAmount}
					onchange={() => playSound("change_value")}
				/>
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
				<div class="selected-map-field bright-soft">
					<p id="multiplayer-map-display">
						{idToMapName($multiplayerMap)}
					</p>
					<button
						class="standard-button bright"
						onclick={() => {
							playSound("basic_button");
							goto("/maps?for-multiplayer=true");
						}}><ArrowRightLeft size={17} strokeWidth={2} /></button
					>
				</div>
			</div>
			<!-- Create button -->
			<div class="multiplayer-host-submit-area bar-menu">
				<button
					id="multiplayer-host"
					class="standard-button large"
					onclick={async () => {
						isCreatingRoom = true;
						playSound("basic_button");
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
						if (get(multiplayer))
							showErrorPopup("Failed to start room", "Error occurred starting the room.", error.message);
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
		min-height: calc(100dvh - var(--menu-padding-top) - var(--layout-margin));
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
	}

	.selected-map-field p {
		margin-inline: var(--box-margin);
	}
</style>
