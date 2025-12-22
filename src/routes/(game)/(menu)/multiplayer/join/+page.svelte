<script>
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { joinRoom } from "$lib/logic/multiplayerLogic";
	import { Copy, Unplug, Users } from "@lucide/svelte";
	import { blur, slide } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";
	import { fetchPublicRooms } from "$lib/utils/publicRooms";
	import { idToMapName } from "$lib/utils/idToMapName";

	let roomCodeInput = $state("");
	let openRooms = $state([]);
	let inputRefs = []; // Store references to input elements
	let segments = $state(["", "", "", "", "", ""]); // 6 segments for XXX-XXX

	let fetchRoomsInterval;

	// Update roomCodeInput when segments change
	$effect(() => {
		roomCodeInput = segments.slice(0, 3).join("") + segments.slice(3, 6).join("");
	});

	function handleInput(index, event) {
		const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
		segments[index] = value.slice(-1); // Only keep last character
		if (value && index < 5) inputRefs[index + 1]?.focus(); // Move to next input
	}

	function handleKeydown(index, event) {
		if (event.key === "Backspace" && !segments[index] && index > 0) inputRefs[index - 1]?.focus(); // Move to previous input on backspace
	}

	function handlePaste(event) {
		event.preventDefault();
		const paste = event.clipboardData
			.getData("text")
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "");
		if (paste.length <= 6) {
			for (let i = 0; i < 6; i++) {
				segments[i] = paste[i] || "";
			}
		}
	}

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
			<p class="multiplayerInputInfo">{$multiplayerStatus || ""}</p>
			<div class="segmentedInputBox" onpaste={handlePaste}>
				{#each segments as segment, i}
					{@const placeholder = ["A", "B", "C", "1", "2", "3"]}
					<input
						type="text"
						class="segmentInput"
						placeholder={placeholder[i]}
						bind:this={inputRefs[i]}
						bind:value={segments[i]}
						oninput={(e) => handleInput(i, e)}
						onkeydown={(e) => handleKeydown(i, e)}
						maxlength={1}
					/>
					{#if i === 2}
						<span class="dash">-</span>
					{/if}
				{/each}
			</div>
		</div>
		<button
			id="multiplayerJoin"
			class="standardButton largeButton"
			disabled={roomCodeInput.length !== 6}
			onclick={() => {
				playSound("start_button");
				joinRoom(roomCodeInput);
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
				<p class="roomItemMapName">Map: {idToMapName(room?.map)}</p>
				<button
					class="standardButton white"
					onclick={() => {
						playSound("basic_button");
						const code = room?.room_code;
						if (!code) return console.warn("Roomcode is not set.");
						for (let i = 0; i < 6; i++) {
							segments[i] = code[i] || "";
						}
						joinRoom(code);
					}}
				>
					<Unplug strokeWidth={2} size={22} style="margin-bottom: -3px;" />
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
		max-width: 390px;
		margin-inline: auto;
		width: calc(100% - 10px);
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
		max-width: 400px;
		width: 100%;
		max-height: 275px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.publicRoomItem {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--box-shadow);
		border: none;
		border-radius: var(--box-margin);
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

	.inputCenterBox {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 320px;
	}

	.segmentedInputBox {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		justify-content: center;
	}

	.segmentInput {
		width: 38px;
		height: 50px;
		border-radius: var(--box-margin);
		text-align: center;
		text-transform: uppercase;
	}

	.segmentInput::placeholder {
		opacity: 0.25 !important;
	}

	.dash {
		opacity: 0.25;
		color: white;
		font-size: 22px;
	}

	.multiplayerJoinField {
		justify-content: center;
		align-items: center;
		flex-direction: column;
		flex-wrap: wrap;
		display: flex;
		gap: var(--box-margin);
		width: 300px;
	}

	#multiplayerJoin {
		padding-inline: 50px;
		margin-top: var(--layout-margin);
	}

	.multiplayerInputInfo {
		padding: 0;
		overflow: hidden;
		width: calc(100% - 10px);
		text-overflow: ellipsis;
		opacity: 0.5;
	}
</style>
