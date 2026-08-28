<!-- A popup where you can search for other players and send out friend requests -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { friendBrowserPopup, inboxPopup, outboxPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
	import { showProfile } from "$lib/utils/showProfile";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Mail, MailClock, Search, UserRoundPlus } from "@lucide/svelte";
	import { newFriendRequest } from "$lib/stores/context-specific/inboxOutboxStore";
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
		<h1 id="friend-browser-header">Add a friend</h1>
	</div>
	<search class="player-search">
		<input
			maxlength="255"
			type="text"
			id="friend-browser-input"
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
			id="start-friend-search"
			class="standard-button white"
			onclick={() => {
				playSound("basic_button");
				startSearch();
			}}
		>
			<Search size={20} strokeWidth={2.25} style="margin-top: 3px;" />
		</button>
	</search>
	<div class="container-box">
		<div class="container-box-scroll of-top of-bottom">
			{#if userSearchResults}
				{#each userSearchResults as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="friend-search-item"
						onclick={() => {
							showProfile(entry.id);
						}}
						role="menu"
						tabindex="0"
					>
						<p class="entry-name">{entry.user_name}</p>
						<button
							id="send-friend-request"
							class="send-friend-request-browser standard-button white"
							disabled={entry.id == yourId}
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
				<p class="player-search-error">No results.</p>
			{/if}
		</div>
	</div>
	<div class="submenu-box" style:margin-bottom="var(--layout-margin)">
		<p style:margin-right="var(--box-margin)" style:margin-left="var(--content-margin)" style:flex-grow="100">
			Sent requests
		</p>
		<button
			class="standard-button white"
			style:position="relative"
			style:flex-grow="1"
			onclick={() => {
				playSound("basic_button");
				outboxPopup.set(true);
			}}
		>
			Manage
			<MailClock strokeWidth={2.25} size={20} style="margin-bottom: -3px; margin-left: 2px;" />
		</button>
	</div>
	<div class="submenu-box">
		<p style:margin-right="var(--box-margin)" style:margin-left="var(--content-margin)" style:flex-grow="100">
			Incoming requests
			{#if $newFriendRequest}
				<Chip red={true} italic={true} mutedOpacity={false} text="New" class="new-chip" />
			{/if}
		</p>
		<button
			class="standard-button white"
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
	.player-search-error {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-bottom: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	:global(.new-chip) {
		margin-left: var(--content-margin);
	}

	.submenu-box {
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

	.container-box {
		position: relative;
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding: var(--box-margin);
		margin-bottom: var(--layout-margin);
	}

	.container-box-scroll {
		max-height: min(440px, calc(100dvh - 450px));
		min-height: 20dvh;
		scrollbar-width: none;
		display: flex;
		overflow-x: hidden;
		overflow-y: auto;
		width: 100%;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.friend-search-item {
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

	.friend-search-item:hover {
		cursor: pointer;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.entry-name {
		max-width: 60%;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	#friend-browser-input {
		padding-inline: var(--layout-margin);
		flex-grow: 1;
		min-width: 0;
	}

	.player-search {
		margin-bottom: var(--layout-margin);
		gap: var(--layout-margin);
		display: flex;
		justify-content: end;
	}

	#start-friend-search {
		width: fit-content;
	}

	.send-friend-request-browser {
		margin-right: -10px;
	}
</style>
