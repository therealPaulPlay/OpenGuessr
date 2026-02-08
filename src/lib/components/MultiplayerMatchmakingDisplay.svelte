<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		skillBasedMatchmaking,
		matchmakingHosting,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import { Info, RefreshCcw } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	let { supportsSkillbased = true, findFunction = () => console.warn("No find function set!") } = $props();
</script>

<p class="multiplayer-matchmaking-status" class:loading={$multiplayerStatus && $matchmakingHosting}>
	{$multiplayerStatus || "No match found."}
</p>
{#if $skillBasedMatchmaking && supportsSkillbased}
	<div class="info-container" transition:slide>
		<Info strokeWidth={2.25} size={34} color="white" style="opacity: 50%; margin-right: 5px; margin-left: 2px;" />
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
		} else leaveMultiplayer();
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
		border-radius: 15px;
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: 5px;
		margin-bottom: var(--layout-margin);
		max-width: 300px;
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
		font-size: 30px;
		color: white;
		margin-bottom: var(--layout-margin);
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
