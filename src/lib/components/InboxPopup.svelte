<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { inboxPopup } from "$lib/stores/uiStore";
	import { inboxIconNew, inboxContent } from "$lib/stores/context-specific/inboxStore";
	import { loadInbox } from "$lib/logic/friendAPI";
	import { playSound } from "$lib/utils/soundManager";
	import { acceptFriendRequest, declineFriendRequest } from "$lib/logic/friendAPI";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { Check, X } from "lucide-svelte";

	let inboxRefreshInterval;

	inboxPopup.subscribe((value) => {
		if (value) {
			inboxIconNew.set(false);
			loadInbox();

			// Refetch every X seconds
			clearInterval(inboxRefreshInterval);
			inboxRefreshInterval = setInterval(() => {
				loadInbox();
			}, 8000);
		} else {
			clearInterval(inboxRefreshInterval);
		}
	});
</script>

{#if $inboxPopup}
	<Popup z={960} slim={true}>
		<div class="popup-title">
			<h1 id="inboxPopupHeader">Inbox</h1>
		</div>
		<div id="friendInbox" class="playerSearchBox">
			{#if $inboxContent}
				{#each $inboxContent as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="friendSearchItem"
						role="menu"
						tabindex="0"
						onclick={() => {
							loadProfileFromId(entry.id, true);
						}}
					>
						<p>{entry.user_name}</p>
						<div class="inboxItemButtons">
							<button
								class="standardButton white"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									acceptFriendRequest(entry.id);
								}}
							>
								<Check size="17" strokeWidth="3.5" />
							</button>
							<button
								class="standardButton white"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									declineFriendRequest(entry.id);
								}}
							>
								<X size="17" strokeWidth="3.5" />
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<p class="noResultsText">Your inbox is empty.</p>
			{/if}
		</div>
		<button
			id="friendInboxClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				inboxPopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	.friendSearchItem {
		background-color: var(--box-color);
		border-radius: 5px;
		width: calc(100% - 30px);
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--box-margin-buttons);
		padding-inline: 15px;
		margin-bottom: 10px;
		transition: background-color 250ms ease;
		gap: var(--box-margin-buttons);
		cursor: pointer;
	}

	.friendSearchItem:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.noResultsText {
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
	}

	.friendSearchItem p {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 20vw;
	}

	.inboxItemButtons {
		display: flex;
		width: fit-content;
		overflow: hidden;
		gap: var(--box-gap-buttons);
		margin-right: -7px;
		flex-grow: 5;
		max-width: fit-content;
	}
</style>
