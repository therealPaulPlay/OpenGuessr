<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { loadOutbox, revokeRequest } from "$lib/logic/friendAPI";
	import { outboxContent } from "$lib/stores/context-specific/inboxOutboxStore";
	import { outboxPopup } from "$lib/stores/uiStore";
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { X } from "@lucide/svelte";

	let outboxRefreshInterval;
	let errorText = $state("Loading...");

	outboxPopup.subscribe(async (value) => {
		if (value) {
			// Refetch every X seconds
			clearInterval(outboxRefreshInterval);
			outboxRefreshInterval = setInterval(() => {
				loadOutbox();
			}, 8_000);

			errorText = "Loading...";
			await loadOutbox();
			errorText = "No sent friend requests.";
		} else clearInterval(outboxRefreshInterval);
	});
</script>

<Popup verySlim={true} bind:open={$outboxPopup}>
	<div class="popup-title">
		<h1>Sent</h1>
	</div>
	<div class="container-box">
		<div class="container-box-scroll of-top of-bottom">
			{#if $outboxContent && $outboxContent.length}
				{#each $outboxContent as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="inbox-item"
						role="menu"
						tabindex="0"
						onclick={() => {
							showProfile(entry.id);
						}}
					>
						<p class="truncate-name">{entry.user_name}</p>
						<button
							class="standard-button white"
							onclick={(e) => {
								e.stopPropagation();
								playSound("basic_button");
								revokeRequest(entry.id);
							}}
						>
							<X size={20} strokeWidth={2.25} style="margin-bottom: -2px;" />
						</button>
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
		width: 100%;
		box-sizing: border-box;
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--box-margin);
		padding-left: var(--layout-margin);
		transition: background-color 250ms ease;
		gap: var(--box-margin);
		cursor: pointer;
	}

	.inbox-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.truncate-name {
		overflow: hidden;
		text-overflow: ellipsis;
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
</style>
