<script>
	import { roundLogPopup } from "$lib/stores/uiStore";
	import Popup from "./ui/Popup.svelte";
	import { roundLog } from "$lib/stores/locationStore";
	import { onMount } from "svelte";
	import { formatDistance } from "$lib/utils/distanceFunctions";
	import { openLocationOnMaps } from "$lib/utils/streetViewUrl";
	import { playSound } from "$lib/utils/soundManager";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { ExternalLink } from "@lucide/svelte";

	onMount(() => {
		try {
			roundLog.set(JSON.parse(localStorage.getItem("roundLog")) || []);
		} catch (error) {
			console.error("Error parsing roundLog JSON:", error);
		}
	});
</script>

<Popup verySlim={true} bind:open={$roundLogPopup} z={971}>
	<div class="popup-title">
		<h1>Rounds</h1>
	</div>
	<div class="round-log-container">
		<div class="round-log-box of-top of-bottom of-length-1.5">
			<!-- round log will be automatically generated here -->
			{#if $roundLog?.length > 0}
				{#each $roundLog as [mode, distance, location], index}
					<div class="round-log-item" class:current={index === 0}>
						<div>
							<p class="log-item-mode">{mode}</p>
							<p>{formatDistance(distance)} away</p>
						</div>
						<button
							class="standard-button white"
							onclick={() => {
								playSound("basic_button");
								openLocationOnMaps(location[0], location[1], location[2]);
							}}
						>
							View <ExternalLink size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-left: 2px;" />
						</button>
					</div>
					{#if index === 0}
						<TitleSeparator text="Previous" noMargin={true} />
						{#if $roundLog?.length == 1}
							<p class="center-log-text extra-margin-bottom">No previous rounds.</p>
						{/if}
					{/if}
				{/each}
			{:else}
				<p class="center-log-text">No saved rounds.</p>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.round-log-box {
		display: flex;
		align-items: center;
		justify-content: safe center;
		gap: var(--box-margin);
		flex-direction: column;
		overflow-y: auto;
		max-height: min(330px, calc(100dvh - 200px));
		padding-bottom: 0;
		scrollbar-width: none;
	}

	.log-item-mode {
		font-size: 20px;
		opacity: 50%;
	}

	.round-log-container {
		height: fit-content;
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	.center-log-text {
		text-align: center;
		width: 100%;
		opacity: 50%;
		font-size: 22px;
		padding-top: var(--box-margin);
		padding-bottom: var(--box-margin);
	}

	.extra-margin-bottom {
		padding-bottom: calc(var(--layout-margin) + var(--content-margin));
	}

	.round-log-item {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--content-margin);
		width: calc(100% - 30px);
	}

	.current {
		background-color: rgba(255, 255, 255, 0.1);
		margin-bottom: var(--content-margin);
	}
</style>
