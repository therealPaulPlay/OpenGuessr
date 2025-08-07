<!-- A popup where you can search for other players and send out friend requests -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { friendBrowserPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Search, UserRoundPlus } from "lucide-svelte";

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

<Popup z={960} slim={true} bind:open={$friendBrowserPopup}>
	<div class="popup-title">
		<h1 id="friendBrowserHeader">Search players</h1>
	</div>
	<search class="playerSearch">
		<input
			maxlength="255"
			type="text"
			id="friendBrowserInput"
			bind:value={searchQuery}
			placeholder="Search for a name"
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
							Add <UserRoundPlus style="margin-bottom: -1px; margin-left: 2px;" size={20} strokeWidth={2.25} />
						</button>
					</div>
				{/each}
			{:else}
				<p class="playerSearchError">Search returned no results.</p>
			{/if}
		</div>
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

	.containerBox {
		position: relative;
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: 10px;
		background-color: var(--box-color);
		margin-top: var(--box-margin);
		padding: var(--box-margin);
	}

	.containerBoxScroll {
		max-height: min(500px, calc(100dvh - 300px));
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
