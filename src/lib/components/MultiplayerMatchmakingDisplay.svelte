<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		skillBasedMatchmaking,
		matchmakingHosting,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { Info, RefreshCcw } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	let {
		showSkillbasedInfo = true,
		findFunction = () => console.warn("No find function set!"),
		cancelFunction = () => console.warn("No cancel function set!"),
	} = $props();
</script>

<h2 class="multiplayer-matchmaking-status" class:loading={$multiplayerStatus && $matchmakingHosting}>
	{$multiplayerStatus || "No match found."}
</h2>
{#if $skillBasedMatchmaking && showSkillbasedInfo}
	<div class="info-container" transition:slide>
		<Info strokeWidth={2.25} color="white" style="opacity: 50%; margin-right: var(--panel-margin); margin-left: 2px; min-width: 24px;" />
		<p>Skill-based matchmaking has longer waiting times.</p>
	</div>
{/if}
<button
	class="standardButton try-button largeButton"
	disabled={$matchmakingActive && !$matchmakingHosting}
	onclick={() => {
		if (!$matchmakingActive) {
			playSound("basic_button");
			findFunction?.();
		} else cancelFunction?.();
	}}
	>{$matchmakingActive ? "Cancel" : "Try again"}
	{#if !$matchmakingActive}
		<span class="refresh-icon"><RefreshCcw strokeWidth={3} size={18} /></span>
	{/if}</button
>

<style>
	.info-container {
		display: flex;
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: 5px;
		max-width: 300px;
		margin-bottom: var(--box-margin);
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.multiplayer-matchmaking-status.loading {
		animation: loading-text 1s infinite;
	}

	.refresh-icon {
		margin-left: 5px;
		vertical-align: -1px;
	}

	.try-button {
		padding-inline: 20px;
	}

	.multiplayer-matchmaking-status {
		text-align: center;
		width: 100%;
		text-wrap: wrap;
		color: white;
		margin-bottom: var(--box-margin);
		max-width: 400px;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 250ms ease;
	}

	@keyframes loading-text {
		0% {
			color: white;
		}

		50% {
			color: rgb(140, 140, 140);
		}

		100% {
			color: white;
		}
	}
</style>
