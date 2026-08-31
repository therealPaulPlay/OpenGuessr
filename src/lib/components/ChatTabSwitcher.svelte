<script>
	import { chatArray, chatMutedPlayers, socket, teamAmount } from "$lib/stores/context-specific/multiplayerStore";
	import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import Chip from "./ui/Chip.svelte";
	import Tabs from "./ui/Tabs.svelte";
	import { slide } from "svelte/transition";
	import { untrack } from "svelte";
	let { isTeamChat = false, inPanel = true, onChange } = $props();

	// "New" indicator for new messages in the chat (team/global) player currently isn't in ----------------------------------
	function countMessages() {
		const messages = ($chatArray || []).filter(
			(chat) => chat.clientId != "server" && !$chatMutedPlayers?.includes(chat.clientId),
		);
		return {
			global: messages.filter((m) => m.teamIndex == null).length,
			team: messages.filter((m) => m.teamIndex != null && m.teamIndex == getTeamFromClientId(get(socket)?.id)).length,
		};
	}

	let messageAmounts = $state(countMessages());
	let seenMessageAmounts = $state(countMessages()); // Initialized with current msg amounts

	$effect(() => {
		$chatArray;
		$chatMutedPlayers;
		isTeamChat;

		untrack(() => {
			messageAmounts = countMessages();
			const currentTab = isTeamChat ? "team" : "global";
			seenMessageAmounts[currentTab] = messageAmounts[currentTab]; // Always count the open chat as fully seen
		});
	});

	// Revert chat selection to global if team amount changes to 1 ------------------------------
	$effect(() => {
		if ($teamAmount <= 1 && isTeamChat) onChange?.(false);
	});
</script>

{#if $teamAmount > 1}
	<div class:bar-menu={inPanel} class:in-menu={!inPanel} class:no-bottom-border-radius={inPanel}>
		<Tabs
			tabs={["Global", "Team"]}
			onchange={(selection, _) => {
				playSound("basic_button");
				onChange?.(selection === "Team"); // True -> team chat, false -> global chat
			}}
		>
			{#snippet children(tab)}
				{#if tab === "Team" ? messageAmounts.team > seenMessageAmounts.team : messageAmounts.global > seenMessageAmounts.global}
					<div transition:slide={{ axis: "x" }} style:margin-left="var(--box-margin)">
						<Chip text="New" italic={true} red={true} mutedOpacity={false} />
					</div>
				{/if}
			{/snippet}
		</Tabs>
	</div>
{/if}

<style>
	.in-menu {
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		width: fit-content;
	}

	.no-bottom-border-radius {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		margin-left: var(--panel-margin);
	}
</style>
