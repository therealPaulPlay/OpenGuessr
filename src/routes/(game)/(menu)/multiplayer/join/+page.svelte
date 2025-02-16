<script>
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { joinRoom } from "$lib/logic/multiplayerLogic";
	import { Users } from "lucide-svelte";
	import { blur, slide } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";

	let roomCodeInput = $state("");
	let openRooms = $state([]);

	async function fetchOpenRooms() {
		try {
			const response = await fetch("https://accounts.openguessr.com/accounts/rooms/list-open-rooms");

			if (response.ok) {
				const data = await response.json();
				openRooms = data || [];
			} else {
				console.error("Failed to load open rooms: " + response.status);
			}
		} catch (error) {
			console.error("Failed ro load open rooms (Network): ", error);
		}
	}

	let fetchRoomsInterval;

	onMount(() => {
		fetchOpenRooms();
		clearInterval(fetchRoomsInterval);
		fetchRoomsInterval = setInterval(fetchOpenRooms, 10000);
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
			<p id="multiplayerJoinInfo" class="multiplayerInputInfo">{$multiplayerStatus || "Input a code."}</p>
			<input type="text" class="multiplayerInput" placeholder="Room code" bind:value={roomCodeInput} />
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
	<p class="openRoomsTitle" transition:slide>Open Rooms:</p>
	<div class="openRoomBox" transition:blur>
		{#each openRooms as room}
			<div class="openRoomItem">
				<p>{room?.player_count} <Users strokeWidth={2.5} /></p>
				<p>Map: {room?.map}</p>
				<button
					class="standardButton white"
					onclick={() => {
						playSound("basic_button");
						roomCodeInput = room?.room_code;
						joinRoom(roomCodeInput);
					}}
				>
					Join
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

	.openRoomsTitle {
		max-width: 460px;
		margin-inline: auto;
		width: calc(100% - 50px);
		margin-top: 100px;
		opacity: 0.5;
	}

	.openRoomBox {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: 5px;
		background-color: var(--box-color);
		border-radius: 15px;
		margin-inline: auto;
		padding: 10px;
		padding-top: 10px;
		margin-top: 10px;
		max-width: 440px;
		width: calc(100% - 60px);
	}

	.openRoomItem {
		background-color: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-inline: 5px;
		flex-grow: 1;
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

	.multiplayerJoinField {
		width: calc(100% - 20px);
		padding: 10px;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		flex-wrap: wrap;
		display: flex;
		gap: 10px;
	}

	#multiplayerJoin {
		min-height: 50px;
		border-radius: 10px;
		padding-inline: 50px;
	}

	.multiplayerInputInfo {
		padding: 0;
		overflow: hidden;
		width: calc(100% - 40px);
		text-overflow: ellipsis;
		padding-inline: 20px;
		opacity: 0.5;
	}
</style>
