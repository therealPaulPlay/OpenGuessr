<script>
	import { chatManagePopup } from "$lib/stores/uiStore";
	import { Lock, MessageSquareOff, MessageSquare, UserRoundX, LockOpen } from "@lucide/svelte";
	import Popup from "./ui/Popup.svelte";
	import {
		chatMutedPlayers,
		multiplayerSortedPlayersArray,
		socket,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { get } from "svelte/store";
	import Tabs from "./ui/Tabs.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { slide } from "svelte/transition";
	import { multiplayer } from "$lib/stores/modeStore";
	import { loadProfileFromId } from "$lib/utils/loadProfile";

	let roomLocked = $state(get(socket)?.storage?.locked);

	multiplayer.subscribe((value) => {
		if (!value) $chatManagePopup = false;
	});
</script>

<Popup bind:open={$chatManagePopup} verySlim={true} z={900}>
	<div class="popup-title">
		<h1>Moderation</h1>
	</div>
	<div class="general-actions">
		<div class="general-actions-scroll of-left of-right">
			<button
				class="standardButton white"
				disabled={$chatMutedPlayers?.length === get(socket)?.storage?.players?.length - 1}
				onclick={() => {
					playSound("basic_button");
					$chatMutedPlayers = get(socket)?.storage?.players?.reduce((acc, el) => {
						if (el.clientId !== get(socket)?.id) acc.push(el.clientId);
						return acc;
					}, []);
				}}
			>
				<MessageSquareOff class="chat-action-icon" size={20} strokeWidth={2.25} /> Mute all
			</button>
			<button
				class="standardButton white"
				disabled={!$chatMutedPlayers?.length}
				onclick={() => {
					playSound("basic_button");
					$chatMutedPlayers = [];
				}}
			>
				<MessageSquare class="chat-action-icon" size={20} strokeWidth={2.25} /> Unmute all
			</button>
			{#if get(socket)?.isHost && !get(socket)?.storage?.matchmakingRoom && !get(socket)?.storage?.tournamentRoom}
				<button
					class="standardButton white"
					onclick={() => {
						playSound("basic_button");
						const newRoomLockState = !get(socket)?.storage?.locked;
						roomLocked = newRoomLockState;
						get(socket).sendRequest("setRoomLock", newRoomLockState);
					}}
				>
					{#if !roomLocked}
						<Lock class="chat-action-icon" size={20} strokeWidth={2.25} /> Lock room
					{:else}
						<LockOpen class="chat-action-icon" size={20} strokeWidth={2.25} /> Unlock room
					{/if}
				</button>
			{/if}
		</div>
	</div>
	<div class="player-box">
		<div class="player-box-scroll of-top of-bottom">
			{#key $chatMutedPlayers}
				{#each $multiplayerSortedPlayersArray as { clientId, username, score, userId, spectator }}
					<div
						class="player-entry of-left of-right"
						class:your-entry={clientId && clientId == get(socket)?.id}
						transition:slide
					>
						<div class="player-details">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<span
								style:pointer-events={userId == null ? "none" : ""}
								class="player-username"
								role="cell"
								tabindex="0"
								onclick={() => {
									if (userId) loadProfileFromId(userId);
								}}
							>
								{username}
							</span>
							<p class="player-score">{score?.toLocaleString()} Pts.</p>
							{#if spectator}
								<p class="spectator-span">Spectator</p>
							{/if}
						</div>
						<div class="player-actions">
							<Tabs
								selectedIndex={Number(!$chatMutedPlayers?.includes(clientId))}
								tabs={[MessageSquareOff, MessageSquare]}
								disabled={clientId && clientId === get(socket)?.id}
								onchange={(_, selectedIndex) => {
									playSound("basic_button");
									if (selectedIndex == 1) $chatMutedPlayers = [...$chatMutedPlayers?.filter((i) => i !== clientId)];
									else $chatMutedPlayers = [...($chatMutedPlayers || []), clientId];
								}}
							/>
							{#if get(socket)?.isHost && !get(socket)?.storage?.matchmakingRoom && !get(socket)?.storage?.tournamentRoom}
								<button
									class="standardButton white"
									disabled={clientId === get(socket)?.id}
									onclick={() => {
										playSound("basic_button");
										get(socket).sendRequest("kickClient", clientId);
									}}
								>
									<UserRoundX class="chat-action-icon" size={20} strokeWidth={2.25} /> Kick
								</button>
							{/if}
						</div>
					</div>
				{/each}
			{/key}
		</div>
	</div>
</Popup>

<style>
	:global(.chat-action-icon) {
		margin-bottom: -2px;
		margin-right: 2px;
	}

	.spectator-span {
		opacity: 0.5;
	}

	.player-score {
		opacity: 0.5;
		text-wrap: nowrap;
	}

	.player-actions {
		display: flex;
		gap: var(--box-margin);
	}

	.player-details {
		display: flex;
		gap: var(--box-margin);
	}

	.player-entry {
		display: flex;
		justify-content: space-between;
		gap: var(--layout-margin);
		border-radius: 5px;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		min-height: fit-content;
		padding-left: 15px;
		align-items: center;
		overflow-x: auto;
		scrollbar-width: none;
		flex-shrink: 0;
	}

	.player-box {
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		scrollbar-width: none;
	}

	.player-box-scroll {
		display: flex;
		box-sizing: border-box;
		width: 100%;
		gap: var(--box-margin);
		flex-direction: column;
		scrollbar-width: none;
		overflow-y: auto;
		max-height: 250px;
	}

	.your-entry {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.general-actions {
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		margin-bottom: var(--box-margin);
	}

	.general-actions-scroll {
		overflow-x: auto;
		display: flex;
		gap: var(--box-margin);
		scrollbar-width: none;
	}

	.player-username {
		transition: opacity 250ms ease;
		cursor: pointer;
		display: block;
		max-width: 120px;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.player-username:hover {
		opacity: 0.5;
	}
</style>
