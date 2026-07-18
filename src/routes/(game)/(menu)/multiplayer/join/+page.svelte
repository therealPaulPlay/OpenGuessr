<script>
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { joinMultiplayerRoom } from "$lib/logic/multiplayerLogic";
	import { Unplug, User } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { onDestroy, onMount } from "svelte";
	import { fetchOpenRooms } from "$lib/logic/matchmakingLogic";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { showProfile } from "$lib/utils/showProfile";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import Chip from "$lib/components/ui/Chip.svelte";

	let roomCodeInput = $derived(segments.slice(0, 3).join("") + segments.slice(3, 6).join(""));
	let openRooms = $state([]);
	let inputRefs = $state([]); // Store references to input elements
	let segments = $state(["", "", "", "", "", ""]); // 6 segments for XXX-XXX

	let fetchRoomsInterval;

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
		const rooms = await fetchOpenRooms();
		openRooms = rooms?.rooms;
		fetchRoomsInterval = setInterval(async () => {
			const rooms = await fetchOpenRooms();
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
	<div class="input-center-box">
		<div class="multiplayer-join-field">
			<p class="multiplayer-input-info">{$multiplayerStatus || ""}</p>
			<div class="segmented-input-box" onpaste={handlePaste}>
				{#each segments, i}
					{const placeholder = ["A", "B", "C", "1", "2", "3"]}
					<input
						type="text"
						class="segment-input"
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
		<div class="bar-menu join-button-container">
			<button
				id="multiplayer-join"
				class="standard-button large-button"
				disabled={roomCodeInput.length !== 6}
				onclick={() => {
					playSound("start_button");
					joinMultiplayerRoom(roomCodeInput);
				}}>Join</button
			>
		</div>
	</div>
</div>

{#if openRooms?.length > 0}
	<p class="open-room-title" transition:blur>Public rooms</p>
	<div class="open-room-box of-top of-bottom of-length-2" transition:blur>
		{#each openRooms as room}
			<div class="open-room-item" transition:blur>
				<div class="room-item-info-container of-left of-right">
					<Chip mutedOpacity={false}>
						<img class="map-icon" src="/img/maps_icon.png" alt="Maps" />
						{idToMapName(room?.map)}
					</Chip>
					<Chip mutedOpacity={false} onclick={() => showProfile(room?.user_id)}>
						<User size={18} strokeWidth={2.5} style="margin-right: 2px;" />
						{room?.user_name}
					</Chip>
				</div>
				<button
					class="standard-button white"
					{@attach tooltip({ text: "Join" })}
					onclick={() => {
						playSound("basic_button");
						const code = room?.code;
						if (!code) return console.warn("Roomcode is not set.");
						for (let i = 0; i < 6; i++) {
							segments[i] = code[i] || "";
						}
						joinMultiplayerRoom(code);
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
		justify-content: end;
		min-height: calc(50dvh - 120px + 151px);
	}

	.open-room-title {
		max-width: 390px;
		margin-inline: auto;
		width: calc(100% - 10px);
		margin-top: 100px;
		opacity: 0.5;
	}

	.open-room-box {
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
		margin-bottom: var(--layout-spacer);
		overflow-y: auto;
		scrollbar-width: none;
	}

	.open-room-item {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--box-shadow);
		border: none;
		border-radius: var(--box-margin);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--panel-margin);
		padding-left: var(--layout-margin);
		flex-grow: 1;
		width: 100%;
		opacity: 0.5;
		transition: opacity 250ms ease;
		overflow: hidden;
		gap: var(--panel-margin);
	}

	.room-item-info-container {
		gap: var(--panel-margin);
		display: flex;
		align-items: center;
		overflow: hidden;
		padding-bottom: 3px;
		padding-top: 3px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.open-room-item:hover {
		opacity: 1;
	}

	.input-center-box {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 320px;
	}

	.segmented-input-box {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		justify-content: center;
	}

	.segment-input {
		width: 38px;
		height: 50px;
		border-radius: var(--box-margin);
		text-align: center;
		text-transform: uppercase;
	}

	.segment-input::placeholder {
		opacity: 0.25 !important;
	}

	.dash {
		opacity: 0.25;
		color: white;
		font-size: 22px;
	}

	.multiplayer-join-field {
		justify-content: center;
		align-items: center;
		flex-direction: column;
		flex-wrap: wrap;
		display: flex;
		gap: var(--box-margin);
		width: 300px;
	}

	.join-button-container {
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		margin-top: calc(var(--layout-margin) + var(--box-margin));
		border-radius: var(--layout-margin);
	}

	#multiplayer-join {
		padding-inline: 50px;
	}

	.multiplayer-input-info {
		padding: 0;
		overflow: hidden;
		width: calc(100% - 10px);
		text-overflow: ellipsis;
		opacity: 0.5;
	}

	.map-icon {
		width: 20px;
		height: 20px;
		margin-right: 3px;
	}
</style>
