<!-- A popup where you can search for other players and send out friend requests -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { friendBrowserPopup, inboxPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
	import { showProfile } from "$lib/utils/showProfile";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Mail, Search, UserRoundPlus } from "@lucide/svelte";
	import { newFriendRequest } from "$lib/stores/context-specific/inboxStore";
	import Chip from "./ui/Chip.svelte";

	let userSearchResults = $state();
	let searchQuery = $state("");
	let yourId = $state();

	async function startSearch() {
		userSearchResults = undefined;
		yourId = localStorage.getItem("id") || -1;

		if (!searchQuery) return;

		try {
			const query = searchQuery;

			if (!query) {
				errorPopup("Empty search", "The search input cannot be empty.", "Missing query");
				return;
			}

			const response = await fetch($apiUrl + "/friends/search/" + query, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				userSearchResults = data.users;
				if (userSearchResults.length == 0) userSearchResults = undefined;
			} else {
				console.error("Error loading the user browser: " + response.status);
				errorPopup("Error loading users", "An error occured loading users in the user browser.", response.status);
			}
		} catch (error) {
			console.error("Fetch/Network error occurred while loading user browser results: ", error);
			errorPopup("Error loading users (Network)", "A network error occured loading users in the user browser.", error);
		}
	}
</script>

<Popup z={960} slim={true} bind:open={$friendBrowserPopup}>
	<div class="popup-title">
		<h1 id="friendBrowserHeader">Add a friend</h1>
	</div>
	<search class="playerSearch">
		<input
			maxlength="255"
			type="text"
			id="friendBrowserInput"
			bind:value={searchQuery}
			placeholder="Search for a player"
			onkeydown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
				}
			}}
			onkeyup={(event) => {
				if (event.key === "Enter") {
					startSearch();
				}
			}}
		/>
		<button
			id="startFriendSearch"
			class="standardButton white"
			onclick={() => {
				playSound("basic_button");
				startSearch();
			}}
		>
			<Search size={20} strokeWidth={2.25} style="margin-top: 3px;" />
		</button>
	</search>
	<div class="containerBox">
		<div class="containerBoxScroll of-top of-bottom">
			{#if userSearchResults}
				{#each userSearchResults as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="friendSearchItem"
						onclick={() => {
							showProfile(entry.id);
						}}
						role="menu"
						tabindex="0"
					>
						<p class="entryName">{entry.user_name}</p>
						<button
							id="sendFriendRequest"
							class="sendFriendRequestBrowser standardButton white"
							class:friendSearchYou={entry.id == yourId}
							onclick={(e) => {
								e.stopPropagation();
								playSound("basic_button");
								sendFriendRequest(entry.id, e.target);
							}}
						>
							Add <UserRoundPlus style="margin-bottom: -1px; margin-left: 2px;" size={20} strokeWidth={2.25} />
						</button>
					</div>
				{/each}
			{:else}
				<p class="playerSearchError">No results.</p>
			{/if}
		</div>
	</div>
	<div class="incomingBox">
		<p style:margin-right="var(--box-margin)" style:margin-left="var(--content-margin)" style:flex-grow="100">
			Incoming requests
			{#if $newFriendRequest}
				<Chip red={true} italic={true} mutedOpacity={false} text="New" class="newChip" />
			{/if}
		</p>
		<button
			class="standardButton white"
			style:position="relative"
			style:flex-grow="1"
			onclick={() => {
				playSound("basic_button");
				inboxPopup.set(true);
			}}
		>
			Inbox
			<Mail strokeWidth={2.25} size={20} style="margin-bottom: -3px; margin-left: 2px;" />
		</button>
	</div>
</Popup>

<style>
	.playerSearchError {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-bottom: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	:global(.newChip) {
		margin-left: var(--content-margin);
	}

	.incomingBox {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--panel-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		flex-wrap: wrap;
	}

	.containerBox {
		position: relative;
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding: var(--box-margin);
		margin-bottom: var(--layout-margin);
	}

	.containerBoxScroll {
		max-height: min(500px, calc(100dvh - 350px));
		min-height: 20dvh;
		scrollbar-width: none;
		display: flex;
		overflow-x: hidden;
		overflow-y: auto;
		width: 100%;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.friendSearchItem {
		display: flex;
		box-shadow: var(--box-shadow);
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		border-radius: var(--content-margin);
		padding: var(--box-margin);
		padding-inline: 20px;
		width: calc(100% - 40px);
		transition: background-color 250ms ease;
		background-color: var(--box-color);
	}

	.friendSearchItem:hover {
		cursor: pointer;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.entryName {
		max-width: 60%;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.friendSearchYou {
		pointer-events: none;
		opacity: 0.5;
	}

	#friendBrowserInput {
		padding-inline: var(--layout-margin);
		flex-grow: 1;
		min-width: 0;
	}

	.playerSearch {
		margin-bottom: var(--layout-margin);
		gap: var(--layout-margin);
		display: flex;
		justify-content: end;
	}

	#startFriendSearch {
		width: fit-content;
	}

	.sendFriendRequestBrowser {
		margin-right: -10px;
	}
</style>
