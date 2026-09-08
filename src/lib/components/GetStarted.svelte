<script>
	import { goto } from "$app/navigation";
	import MapCard from "$lib/components/MapCard.svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { playSound } from "$lib/utils/soundManager";
	import { ArrowRight } from "@lucide/svelte";
	import { onMount } from "svelte";

	let { imgName, ctaTitle = "It's time to get started.", ctaButton = "Play now", content = [], maps = [] } = $props();

	let loadedMaps = $state([]);
	let loadingText = $state("Loading...");

	async function fetchMap(name) {
		try {
			const response = await fetch($apiUrl + "/maps/" + encodeURIComponent(name));
			if (!response.ok) throw new Error(response.status);
			return await response.json();
		} catch (error) {
			console.error("Failed to load map for get started page:", name, error);
			return null;
		}
	}

	onMount(async () => {
		if (!maps.length) return;
		loadedMaps = (await Promise.all(maps.map(fetchMap))).filter(Boolean);
		if (!loadedMaps.length) loadingText = "Error loading maps.";
	});
</script>

<div class="text-container">
	<img alt="get started hero with Guessy" src={"/img/get-started/" + imgName} class="hero-image" />

	<h1>{content[0]?.heading || "Heading missing."}</h1>
	<p>{content[0]?.paragraph || "Paragraph missing."}</p>
	<br />
	<br />

	<h2>{content[1]?.heading || "Heading missing."}</h2>
	<p>{content[1]?.paragraph || "Paragraph missing."}</p>
	<br />
	<br />

	<h2>{content[2]?.heading || "Heading missing."}</h2>
	<p>{content[2]?.paragraph || "Paragraph missing."}</p>
	<br />

	{#if maps.length}
		<div class="map-container">
			{#if loadedMaps.length}
				{#each loadedMaps as map}
					<MapCard {map} />
				{/each}
			{:else}
				<p class="loading-text">{loadingText}</p>
			{/if}
		</div>
		<br />
		<br />
	{/if}

	<h2>{content[3]?.heading || "Heading missing."}</h2>
	<p>{content[3]?.paragraph || "Paragraph missing."}</p>
	<br />

	<p>{content[3]?.paragraph2 || "Paragraph missing."}</p>

	<div class="cta-container">
		<h2 style:margin-top="var(--layout-margin)">{ctaTitle || "Title missing."}</h2>

		<div class="bar-menu cta-button-box">
			<button
				class="standard-button large-button"
				onclick={() => {
					playSound("basic_button");
					goto("/");
				}}
				>{ctaButton || "Text missing."}
				<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" /></button
			>
		</div>
	</div>
</div>

<style>
	.hero-image {
		width: 100%;
		aspect-ratio: 16/9;
		margin-bottom: var(--layout-spacer);
		border-radius: var(--layout-margin);
		user-select: none;
		pointer-events: none;
	}

	@media (max-width: 800px) and (orientation: portrait) {
		.hero-image {
			margin-bottom: calc(var(--layout-margin) + var(--box-margin));
			margin-top: var(--layout-margin);
		}
	}

	h1 {
		margin-bottom: var(--layout-margin);
	}

	h2 {
		margin-bottom: var(--box-margin);
	}

	.text-container {
		margin-inline: auto;
		margin-bottom: var(--layout-spacer);
		max-width: 900px;
	}

	.cta-container {
		background: linear-gradient(var(--box-color), transparent 50%);
		box-shadow: var(--box-shadow-top);
		border-radius: var(--layout-margin);
		padding: var(--layout-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: calc(var(--layout-margin) + var(--box-margin));
		flex-direction: column;
		margin-top: var(--layout-spacer);
		margin-bottom: var(--layout-spacer);
	}

	.cta-container h2 {
		text-align: center;
		padding-inline: var(--content-margin);
	}

	.map-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--layout-margin);
	}

	.loading-text {
		opacity: 0.5;
		margin-inline: auto;
		grid-column: 2;
	}

	.cta-button-box {
		border-radius: var(--layout-margin);
	}
</style>
