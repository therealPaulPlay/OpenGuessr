<script>
	import { matchOverviewPopup } from "$lib/stores/uiStore";
	import { matchData } from "$lib/stores/context-specific/matchOverviewStore";
	import { panoramaKey, streetViewURLPrefix } from "$lib/stores/locationStore";
	import { wrapBackLon } from "$lib/logic/miniMap";
	import { playSound } from "$lib/utils/soundManager";
	import { showProfile } from "$lib/utils/showProfile";
	import Popup from "./ui/Popup.svelte";
	import Tabs from "./ui/Tabs.svelte";
	import SvgMap from "./SvgMap.svelte";

	let selectedIndex = $state(0);
	let viewMode = $state("Map");

	let rounds = $derived($matchData?.rounds ?? []);
	let tabs = $derived(rounds.length ? rounds.map((r) => String(r.round)) : ["1", "2", "3"]);
	let currentRound = $derived(rounds[selectedIndex]);

	let panoramaSrc = $derived(
		currentRound
			? $streetViewURLPrefix +
					currentRound.location.lat +
					"," +
					currentRound.location.lon +
					"&key=" +
					$panoramaKey +
					"&fov=90"
			: "",
	);

	let markerList = $derived(
		currentRound
			? [
					{ lat: currentRound.location.lat, lon: wrapBackLon(currentRound.location.lon), shape: "flag" },
					...currentRound.guesses.map((g) => ({ lat: g.lat, lon: wrapBackLon(g.lon), label: g.username })),
				]
			: [],
	);
	let lineList = $derived(
		currentRound
			? currentRound.guesses.map((g) => ({
					from: { lat: g.lat, lon: wrapBackLon(g.lon) },
					to: { lat: currentRound.location.lat, lon: wrapBackLon(currentRound.location.lon) },
				}))
			: [],
	);

	matchOverviewPopup.subscribe((open) => {
		if (open) {
			selectedIndex = 0;
			viewMode = "Map";
		}
	});
</script>

<Popup z={961} slim={true} bind:open={$matchOverviewPopup}>
	<div class="popup-title">
		<h1>Overview</h1>
	</div>

	<div class="view-mode-bar">
		<p style:padding-inline="var(--content-margin)">View mode</p>
		<Tabs
			tabs={["Map", "Panorama"]}
			disabled={!currentRound}
			onchange={(selection) => {
				playSound("basic_button");
				viewMode = selection;
			}}
		/>
	</div>
	<div class="view-wrapper">
		{#if !$matchData}
			<p class="loading-note">Loading...</p>
		{:else if rounds.length === 0}
			<p class="loading-note">No data available.</p>
		{:else}
			<!-- Both views stay mounted so switching tabs doesn't remount/reload them -->
			<div class="view-pane" class:hidden={viewMode !== "Map"}>
				<SvgMap width={700} height={400} interactive={true} {markerList} {lineList} />
				<div class="score-panel barMenu">
					{#each currentRound.guesses as guess (guess.userId)}
						<div class="score-row">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<span
								class="score-name"
								role="button"
								tabindex="0"
								onclick={() => showProfile(guess.userId)}
							>{guess.username}</span>
							<span class="score-points">{guess.totalPoints.toLocaleString()}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="view-pane" class:hidden={viewMode !== "Panorama"}>
				<!-- svelte-ignore a11y_missing_attribute -->
				<iframe class="panorama-iframe" referrerpolicy="no-referrer-when-downgrade" frameborder="0" src={panoramaSrc}
				></iframe>
			</div>
		{/if}
	</div>
	<div class="tabs-row">
		<Tabs {tabs} disabled={!rounds.length} bind:selectedIndex onchange={() => playSound("basic_button")} />
	</div>
</Popup>

<style>
	.loading-note {
		opacity: 0.5;
		text-align: center;
	}

	.view-mode-bar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--box-margin);
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		margin-bottom: var(--layout-margin);
	}

	.view-wrapper {
		position: relative;
		height: 400px;
		border-radius: var(--box-margin);
		overflow: hidden;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color-dark);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.view-pane {
		position: absolute;
		inset: 0;
	}

	.view-pane.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	.panorama-iframe {
		width: 100%;
		height: 100%;
		border: none;
		background-color: white;
	}

	.score-panel {
		position: absolute;
		top: var(--layout-margin);
		right: var(--layout-margin);
		flex-direction: column;
		align-items: stretch;
		gap: var(--content-margin);
		border-radius: var(--content-margin);
		padding-inline: var(--layout-margin);
	}

	.score-row {
		display: flex;
		justify-content: space-between;
		gap: var(--box-margin);
	}

	.score-name {
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		max-width: 140px;
		cursor: pointer;
		transition: opacity 250ms ease;
	}

	.score-name:hover {
		opacity: 0.5;
	}

	.score-points {
		opacity: 0.75;
		min-width: 50px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.tabs-row {
		display: flex;
		justify-content: center;
		margin-top: var(--layout-margin);
	}
</style>
