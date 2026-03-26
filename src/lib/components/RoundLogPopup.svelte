<script>
	import { roundLogPopup } from "$lib/stores/uiStore";
	import Popup from "./ui/Popup.svelte";
	import { roundLog } from "$lib/stores/locationStore";
	import { onMount } from "svelte";
	import { formatDistance } from "$lib/utils/distanceFunctions";
	import { openLocationOnMaps } from "$lib/utils/openLocationOnMaps";
	import { playSound } from "$lib/utils/soundManager";

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
		<h1>Round history</h1>
	</div>
	<div class="roundLogContainer">
		<div class="roundLogBox of-top of-bottom of-length-1.5">
			<!-- round log will be automatically generated here -->
			{#if $roundLog?.length > 0}
				{#each $roundLog as [mode, distance, coordinates]}
					<div class="roundLogItem">
						<div>
							<p class="logItemMode">{mode}</p>
							<p>{formatDistance(distance)} away</p>
						</div>
						<button
							class="standardButton white"
							onclick={() => {
								playSound("basic_button");
								openLocationOnMaps(coordinates[0], coordinates[1]);
							}}
						>
							View
						</button>
					</div>
				{/each}
			{:else}
				<p class="centerLogText">No saved rounds.</p>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.roundLogBox {
		display: flex;
		align-items: center;
		justify-content: safe center;
		gap: var(--box-margin);
		flex-direction: column;
		overflow-y: auto;
		max-height: min(350px, calc(100dvh - 200px));
		padding-bottom: 0;
		scrollbar-width: none;
	}

	.logItemMode {
		font-size: 20px;
		opacity: 50%;
	}

	.roundLogContainer {
		height: fit-content;
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	.centerLogText {
		text-align: center;
		width: 100%;
		opacity: 50%;
		font-size: 22px;
		padding-top: var(--content-margin);
		padding-bottom: var(--content-margin);
	}

	.roundLogItem {
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
</style>
