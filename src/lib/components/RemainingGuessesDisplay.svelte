<!-- For Multiplayer - Shows, who still hasn't guessed -->
<script>
	import {
		connectedPlayers,
		multiplayerGuessesLocationsArray,
		peerId,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { fade } from "svelte/transition";

	// Helper function to truncate names
	const truncateName = (name) => {
		return name.length > 10 ? `${name.slice(0, 7)}...` : name;
	};

	// Derive the players who haven't guessed yet
	const remainingPlayers = $derived(
		$connectedPlayers.filter((player) => {
			const peerID = player[0];
			return !$multiplayerGuessesLocationsArray.some((guess) => guess[4] === peerID);
		}),
	);

	// Get just the usernames of remaining players and truncate if necessary
	const remainingNames = $derived(remainingPlayers.map((player) => truncateName(player[1])));

	// Format the waiting message based on number of remaining players
	const waitingMessage = $derived(
		remainingNames.length === 0
			? { prefix: "", names: [], suffix: "" }
			: remainingNames.length > 3
				? { prefix: "Waiting for ", names: [`${remainingNames.length} players`], suffix: "." }
				: remainingNames.length === 1
					? { prefix: "Waiting for ", names: [remainingNames[0]], suffix: "." }
					: remainingNames.length === 2
						? { prefix: "Waiting for ", names: [remainingNames[0], remainingNames[1]], separator: " and ", suffix: "." }
						: {
								prefix: "Waiting for ",
								names: [remainingNames[0], remainingNames[1], remainingNames[2]],
								separator: ", ",
								lastSeparator: " and",
								suffix: ".",
							},
	);
</script>

{#if remainingNames.length > 0 && $multiplayerGuessesLocationsArray.some((element) => element[4] == $peerId)}
	<div class="remainingGuessesDisplay" transition:fade={{ duration: 250 }}>
		<p transition:fade={{ duration: 250 }}>
			<span class="dimmed">{waitingMessage.prefix}</span>
			{#each waitingMessage.names as name, i}
				{#if i > 0}
					<span class="dimmed"
						>{i === waitingMessage.names.length - 1 && waitingMessage.lastSeparator
							? waitingMessage.lastSeparator + " "
							: waitingMessage.separator}</span
					>
				{/if}
				<span class="name">{name}</span>
			{/each}<span class="dimmed">{waitingMessage.suffix}</span>
		</p>
	</div>
{/if}

<style>
	.remainingGuessesDisplay {
		border-radius: 10px;
		background-color: var(--box-color);
		padding: 5px;
		padding-inline: 10px;
		width: calc(100% - 20px);
		font-size: 20px;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	.remainingGuessesDisplay p {
		font-size: 20px;
	}
	.dimmed {
		opacity: 0.75;
	}
	.name {
		opacity: 1;
	}
</style>
