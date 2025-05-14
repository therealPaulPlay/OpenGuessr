<script>
	import { multiplayerStatus, roomcode } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { joinRoom } from "$lib/logic/multiplayerLogic";
	import { Copy, Unplug, Users } from "lucide-svelte";
	import { blur, slide } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";
	import { fetchPublicRooms } from "$lib/utils/publicRooms";

	let roomCodeInput = $state("");
	let openRooms = $state([]);

	let fetchRoomsInterval;

	onMount(async () => {
		clearInterval(fetchRoomsInterval);
		const rooms = await fetchPublicRooms();
		openRooms = rooms?.rooms;
		fetchRoomsInterval = setInterval(async () => {
			const rooms = await fetchPublicRooms();
			openRooms = rooms?.rooms;
		}, 10000);
	});

	onDestroy(() => {
		clearInterval(fetchRoomsInterval);
	});
</script>

<svelte:head>
	<title>Join</title>
</svelte:head>

<div class="main-container">
	<div class="inputCenterBox">
		<div class="multiplayerJoinField">
			<p class="multiplayerInputInfo">{$multiplayerStatus || "Input a code."}</p>
			<input type="text" class="multiplayerInput" placeholder="e.g. 1234xy" bind:value={roomCodeInput} />
		</div>
		<button
			id="multiplayerJoin"
			class="standardButton"
			class:buttonDisabled={!Boolean(roomCodeInput)}
			onclick={() => {
				playSound("start_button");
				joinRoom(roomCodeInput);
			}}
			onkeypress={(e) => {
				if (e.key == "Enter") {
					e.preventDefault();
					playSound("start_button");
					joinRoom(roomCodeInput);
				}
			}}>Join</button
		>
	</div>
</div>
{#if openRooms?.length > 0}
	<p class="publicRoomTitle" transition:blur>Public rooms:</p>
	<div class="publicRoomBox" transition:blur>
		{#each openRooms as room}
			<div class="publicRoomItem">
				<p>{room?.player_count} <Users strokeWidth={2.25} style="margin-bottom: -3px;" /></p>
				<p class="roomItemMapName">Map: {room?.map}</p>
				<button
					class="standardButton white"
					onclick={() => {
						playSound("basic_button");
						roomCodeInput = room?.room_code?.replace("openguessr_", "");
						if (!roomCodeInput) return console.warn("Roomcode is not set.");
						joinRoom(roomCodeInput);
					}}
				>
					<Unplug strokeWidth={2.5} size={22} style="margin-bottom: -3px;" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 50dvh;
	}

	.publicRoomTitle {
		max-width: 440px;
		margin-inline: auto;
		width: calc(100% - 60px);
		margin-top: 100px;
		opacity: 0.5;
	}

	.publicRoomBox {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: var(--layout-margin);
		margin-inline: auto;
		margin-top: var(--box-margin);
		max-width: 460px;
		width: calc(100% - 40px);
		max-height: 275px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.publicRoomItem {
		background-color: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--panel-margin);
		padding-left: 15px;
		flex-grow: 1;
		width: 100%;
		opacity: 0.5;
		transition: opacity 250ms ease;
	}

	.roomItemMapName {
		max-width: 30%;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.publicRoomItem:hover {
		opacity: 1;
	}

	.buttonDisabled {
		pointer-events: none !important;
		opacity: 0.5;
	}

	.inputCenterBox {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 500px;
	}

	.multiplayerInput {
		width: calc(100% - 60px);
		border-radius: 10px;
		min-height: 50px;
		padding-inline: 20px;
	}

	.multiplayerInput::placeholder {
		opacity: 0.35;
	}

	.multiplayerJoinField {
		width: calc(100% - 20px);
		justify-content: center;
		align-items: center;
		flex-direction: column;
		flex-wrap: wrap;
		display: flex;
		gap: var(--box-margin);
	}

	#multiplayerJoin {
		min-height: 50px;
		border-radius: 10px;
		padding-inline: 50px;
		margin-top: var(--layout-margin);
	}

	.multiplayerInputInfo {
		padding: 0;
		overflow: hidden;
		width: calc(100% - 40px);
		text-overflow: ellipsis;
		opacity: 0.5;
	}
</style>
