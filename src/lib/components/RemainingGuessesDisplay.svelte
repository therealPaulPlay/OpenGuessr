<!-- For Multiplayer - Shows, who still hasn't guessed -->
<script>
	import { socket, remainingPlayers } from "$lib/stores/context-specific/multiplayerStore";
	import { fade } from "svelte/transition";

	let { inPanel = true } = $props();

	// Format the waiting message based on number of remaining players
	const waitingMessage = $derived(
		$remainingPlayers?.length === 0
			? { prefix: "", names: [], suffix: "" }
			: $remainingPlayers?.length > 3
				? { prefix: "Waiting for ", names: [`${$remainingPlayers.length} players`], suffix: "." }
				: $remainingPlayers?.length === 1
					? { prefix: "Waiting for ", names: [$remainingPlayers[0]], suffix: "." }
					: $remainingPlayers?.length === 2
						? {
								prefix: "Waiting for ",
								names: [$remainingPlayers[0], $remainingPlayers[1]],
								separator: " and ",
								suffix: ".",
							}
						: {
								prefix: "Waiting for ",
								names: [$remainingPlayers[0], $remainingPlayers[1], $remainingPlayers[2]],
								separator: ", ",
								lastSeparator: " and",
								suffix: ".",
							},
	);
</script>

{#if $remainingPlayers.length > 0 && $socket?.storage?.confirmedArray?.includes($socket?.id)}
	<div class="remaining-guesses-display" transition:fade={{ duration: 250 }} class:display-in-panel={inPanel}>
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
	.remaining-guesses-display {
		z-index: 1;
		user-select: none;
	}

	.display-in-panel {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background-color: var(--panel-color);
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		border-radius: var(--box-margin);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		box-shadow: var(--box-shadow);
		backdrop-filter: blur(10px);
	}

	.dimmed {
		opacity: 0.75;
	}
	.name {
		opacity: 1;
	}
</style>
