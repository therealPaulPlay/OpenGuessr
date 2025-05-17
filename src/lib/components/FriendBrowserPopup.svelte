<!-- A popup where you can search for other players and send out friend requests -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { friendBrowserPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

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

			const response = await fetch($accountUrl + "/friends/search/" + query, {
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

{#if $friendBrowserPopup}
	<Popup z={960} slim={true}>
		<div class="popup-title">
			<h1 id="friendBrowserHeader">Search players</h1>
		</div>
		<search class="playerSearch">
			<input
				maxlength="255"
				type="text"
				id="friendBrowserInput"
				bind:value={searchQuery}
				placeholder="Search for a name..."
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
				<img src="/img/find_icon.png" alt="start search" id="playerSearchIcon" />
			</button>
		</search>
		<div class="playerSearchBox">
			{#if userSearchResults}
				{#each userSearchResults as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="friendSearchItem"
						onclick={() => {
							loadProfileFromId(entry.id, true);
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
							Add <img src="/img/add_friend_icon.png" alt="send friend request" id="addFriendIcon" />
						</button>
					</div>
				{/each}
			{:else}
				<p class="playerSearchError">Search returned no results.</p>
			{/if}
		</div>
		<button
			id="friendBrowserClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				friendBrowserPopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

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

	.playerSearchBox {
		position: relative;
		width: 100%;
		box-sizing: border-box;
		border-radius: 10px;
		max-height: 50vh;
		min-height: 20vh;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--box-color);
		margin-top: var(--box-margin);
		border: var(--box-margin) solid transparent;
		scrollbar-width: none;
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--box-margin);
	}

	#playerSearchIcon {
		width: 20px;
		height: 20px;
		vertical-align: -1px;
	}

	#addFriendIcon {
		width: 22px;
		height: 22px;
		vertical-align: -4px;
		padding-left: 4px;
		pointer-events: none;
	}

	.friendSearchItem {
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		border-radius: 5px;
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
		border-radius: 10px;
		padding-inline: 10px;
		font-size: 22px;
		flex-grow: 1;
	}

	.playerSearch {
		margin-bottom: var(--layout-margin);
		height: 45px;
		gap: var(--layout-margin);
	}

	#startFriendSearch {
		width: fit-content;
		border-radius: 10px;
	}

	.sendFriendRequestBrowser {
		margin-right: -10px;
	}
</style>
