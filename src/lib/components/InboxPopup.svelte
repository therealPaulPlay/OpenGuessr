<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { inboxPopup } from "$lib/stores/uiStore";
	import { newFriendRequest, inboxContent } from "$lib/stores/context-specific/inboxOutboxStore";
	import { loadInbox } from "$lib/logic/friendAPI";
	import { playSound } from "$lib/utils/soundManager";
	import { acceptFriendRequest, declineFriendRequest } from "$lib/logic/friendAPI";
	import { showProfile } from "$lib/utils/showProfile";
	import { Check, X } from "@lucide/svelte";

	let inboxRefreshInterval;
	let errorText = $state("Loading...");

	inboxPopup.subscribe(async (value) => {
		if (value) {
			newFriendRequest.set(false);

			// Refetch every X seconds
			clearInterval(inboxRefreshInterval);
			inboxRefreshInterval = setInterval(() => {
				loadInbox();
			}, 8_000);

			errorText = "Loading...";
			await loadInbox();
			errorText = "No incoming friend requests.";
		} else {
			clearInterval(inboxRefreshInterval);
		}
	});
</script>

<Popup verySlim={true} bind:open={$inboxPopup}>
	<div class="popup-title">
		<h1>Inbox</h1>
	</div>
	<div class="container-box">
		<div class="container-box-scroll of-top of-bottom">
			{#if $inboxContent && $inboxContent.length}
				{#each $inboxContent as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="inbox-item"
						role="menu"
						tabindex="0"
						onclick={() => {
							showProfile(entry.id);
						}}
					>
						<p>{entry.user_name}</p>
						<div class="inbox-item-buttons">
							<button
								class="standard-button white"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									acceptFriendRequest(entry.id);
								}}
							>
								<Check size={20} strokeWidth={2.25} style="margin-bottom: -2px;" />
							</button>
							<button
								class="standard-button white"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									declineFriendRequest(entry.id);
								}}
							>
								<X size={20} strokeWidth={2.25} style="margin-bottom: -1px;" />
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<p class="no-results-text">{errorText}</p>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.inbox-item {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--content-margin);
		width: calc(100% - 30px);
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		transition: background-color 250ms ease;
		gap: var(--box-margin);
		cursor: pointer;
	}

	.inbox-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.no-results-text {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-bottom: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.container-box {
		position: relative;
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		margin-top: var(--box-margin);
		padding: var(--box-margin);
	}

	.container-box-scroll {
		max-height: min(320px, calc(100dvh - 250px));
		min-height: 125px;
		scrollbar-width: none;
		display: flex;
		overflow-x: hidden;
		overflow-y: auto;
		width: 100%;
		height: 320px;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.inbox-item p {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.inbox-item-buttons {
		display: flex;
		width: fit-content;
		gap: var(--box-margin);
		margin-right: -5px;
		flex-grow: 5;
		max-width: fit-content;
	}
</style>
