<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { inboxPopup } from "$lib/stores/uiStore";
	import { inboxIconNew, inboxContent } from "$lib/stores/context-specific/inboxStore";
	import { loadInbox } from "$lib/logic/friendAPI";
	import { playSound } from "$lib/utils/soundManager";
	import { acceptFriendRequest, declineFriendRequest } from "$lib/logic/friendAPI";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { Check, X } from "@lucide/svelte";

	let inboxRefreshInterval;
	let errorText = $state("Loading...");

	inboxPopup.subscribe(async (value) => {
		if (value) {
			inboxIconNew.set(false);

			// Refetch every X seconds
			clearInterval(inboxRefreshInterval);
			inboxRefreshInterval = setInterval(() => {
				loadInbox();
			}, 8000);

			errorText = "Loading...";
			await loadInbox();
			errorText = "Inbox is empty.";
		} else {
			clearInterval(inboxRefreshInterval);
		}
	});
</script>

<Popup z={960} slim={true} bind:open={$inboxPopup}>
	<div class="popup-title">
		<h1 id="inboxPopupHeader">Inbox</h1>
	</div>
	<div class="containerBox">
		<div class="containerBoxScroll of-top of-bottom">
			{#if $inboxContent}
				{#each $inboxContent as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="inboxItem"
						role="menu"
						tabindex="0"
						onclick={() => {
							loadProfileFromId(entry.id);
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
								<Check size={18} strokeWidth={3} style="margin-bottom: -1px;" />
							</button>
							<button
								class="standardButton white"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									declineFriendRequest(entry.id);
								}}
							>
								<X size={18} strokeWidth={3} />
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<p class="noResultsText">{errorText}</p>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.inboxItem {
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

	.inboxItem:hover {
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

	.containerBox {
		position: relative;
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--box-margin);
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

	.inboxItem p {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.inboxItemButtons {
		display: flex;
		width: fit-content;
		gap: var(--box-margin);
		margin-right: -5px;
		flex-grow: 5;
		max-width: fit-content;
	}
</style>
