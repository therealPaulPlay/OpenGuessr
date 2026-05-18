<script module>
	let step = $state(0);

	export function leaveTutorial() {
		clearTimeout(finishTimeout);
		step = 0;
		localStorage.setItem("tutorialCompleted", true);

		// If tutorial was true, regenerate with default map
		if (get(tutorial)) {
			tutorial.set(false);
			changeMap(get(defaultMap), true);
		}
	}

	let finishTimeout;

	export function finishTutorial() {
		finishTimeout = setTimeout(() => {
			step = 3;
			localStorage.setItem("tutorialCompleted", true);
			tutorial.set(false);
		}, 1500);
	}
</script>

<script>
	import { goto } from "$app/navigation";

	import { defaultMap, tutorialMap } from "$lib/stores/context-specific/officialMapsStore";
	import { tutorial } from "$lib/stores/modeStore";
	import { changeMap } from "$lib/utils/changeMap";
	import { playSound } from "$lib/utils/soundManager";
	import { ArrowRight } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { blur, fly } from "svelte/transition";
	import Chip from "./ui/Chip.svelte";

	let howToImage = $state(0);

	const howToSlides = [
		{
			image: "/img/help_image_1.jpg",
			title: "Look at the panorama",
			description: "Look for clues in the panorama.",
		},
		{
			image: "/img/help_image_2.jpg",
			title: "Guess where you are",
			description: "Pinpoint the location on the map — the closer, the higher the score.",
		},
	];

	const paths = [
		{
			title: "Learn with fun",
			imageSrc: "/img/tutorial/tutorial_beginner.png",
			options: [
				{
					title: "Play on Famous Places",
					action: () => changeMap("Famous Places", true),
				},
				{
					title: "Guess the country",
					action: () => changeMap("Country Guessr", true),
				},
			],
		},
		{
			title: "Discover the world",
			imageSrc: "/img/tutorial/tutorial_maps.png",
			options: [
				{
					title: "Play on World",
					action: () => changeMap(get(defaultMap), true),
				},
				{
					title: "All maps",
					action: () => goto("/maps"),
				},
			],
		},
		{
			title: "Get competitive",
			imageSrc: "/img/tutorial/tutorial_competitions.png",
			options: [
				{
					title: "Play multiplayer",
					action: () => goto("/multiplayer"),
				},
				{
					title: "Enter a competition",
					action: () => goto("/competitions"),
				},
			],
		},
	];

	onMount(() => {
		const tutorialCompleted = !(localStorage.getItem("tutorialCompleted") === null);
		if (!tutorialCompleted) step = 1;
	});
</script>

{#if step > 0}
	<div class="tutorial-overlay" transition:blur>
		<div class="content">
			{#if step == 1}
				<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>Welcome, explorer!</h1>
				<div class="subtitle-container">
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Fancy a quick intro to OpenGuessr?</p>
				</div>
				<div class="action-container">
					<button
						class="standardButton largeButton"
						in:fly|global={{ y: 20, duration: 1000 }}
						onclick={() => {
							playSound("basic_button");
							step = 2;
						}}
					>
						Start the tour
						<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
					</button>
					<button class="subtle-button" in:fly|global={{ y: 20, duration: 1000 }} onclick={leaveTutorial}>
						No, skip tour
					</button>
				</div>
			{:else if step == 2}
				<h1 class="title" in:fly={{ y: -20, duration: 1000 }}>How to play</h1>
				{#key howToImage}
					<div class="how-to-slide">
						<div class="how-to-image-container" in:blur|global={{ duration: 500 }}>
							<img class="how-to-image" src={howToSlides[howToImage].image} alt={howToSlides[howToImage].title} />
							<p class="how-to-subtitle" in:blur|global={{ duration: 500 }}>
								{howToSlides[howToImage].description}
							</p>
						</div>
					</div>
				{/key}
				<div class="action-container">
					<button
						class="standardButton largeButton"
						in:fly={{ y: 20, duration: 1000 }}
						onclick={() => {
							playSound("basic_button");
							if (howToImage < howToSlides.length - 1) howToImage++;
							else {
								changeMap($tutorialMap, true);
								step = 0;
								$tutorial = true;
							}
						}}
					>
						{howToImage < howToSlides.length - 1 ? "Next" : "Let's play"}
						<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
					</button>
				</div>
			{:else if step == 3}
				<h1 class="title" in:fly={{ y: -20, duration: 1000 }}>Great work!</h1>
				<div class="subtitle-container">
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Now, choose your next path.</p>
				</div>
				<div class="path-container of-top of-bottom of-length-2">
					{#each paths as section, secIdx}
						<div class="path-section barMenu">
							<p class="section-title">{section.title}</p>
							<img
								alt="section graphic"
								class="section-image"
								style:top={secIdx == 0 ? "-110px" : secIdx == 1 ? "-85px" : "-80px"}
								style:right={secIdx == 0 ? "-75px" : secIdx == 2 ? "-90px" : ""}
								style:left={secIdx == 1 ? "-110px" : ""}
								style:transform={secIdx == 1 ? "rotate(-15deg)" : secIdx == 2 ? "rotate(30deg)" : ""}
								src={section.imageSrc}
							/>
							{#each section.options as option, optIdx}
								<div class="path-option">
									<p style:margin-left="var(--content-margin)">{option.title} {#if secIdx == 0 && optIdx == 0 }<Chip red italic text="Suggested" mutedOpacity={false} style="margin-left: var(--content-margin);" /> {/if}</p>
									<button
										class="standardButton"
										class:white={!(optIdx == 0 && secIdx == 0)}
										style:z-index="1"
										onclick={() => {
											playSound("basic_button");
											step = 0;
											option.action();
										}}><ArrowRight style="margin-bottom: -3px;" /></button
									>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		inset: 0;
		z-index: 14;
		text-align: center;
		align-content: center;
		display: block;
		background-color: var(--dark-background);
		backdrop-filter: blur(5px);
	}

	.action-container {
		display: flex;
		justify-content: stretch;
		align-items: center;
		gap: var(--layout-margin);
		flex-direction: column;
	}

	.path-container {
		display: flex;
		justify-content: stretch;
		align-items: center;
		gap: var(--layout-margin);
		overflow-y: auto;
		max-height: 500px;
		scrollbar-width: none;
		flex-direction: column;
		padding: 100px;
		padding-inline: 150px;
		margin-top: -100px;
		margin-bottom: -100px;
		margin-inline: -150px;
		z-index: 1;
	}

	.path-section {
		align-items: center;
		box-shadow: var(--bulb-shadow);
		width: 500px;
		border-radius: var(--layout-margin);
		flex-direction: column;
		backdrop-filter: none;
		position: relative;
	}

	.section-title {
		text-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
		opacity: 0.75;
		padding: var(--content-margin);
	}

	.section-image {
		position: absolute;
		height: 200px;
		width: 200px;
		pointer-events: none;
		opacity: 0.9;
		user-select: none;
	}

	.path-option {
		border-radius: var(--box-margin);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		gap: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
	}

	.subtle-button {
		padding-inline: var(--content-margin);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 250ms ease;
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	}

	.subtle-button:hover {
		opacity: 0.25;
	}

	.content {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: calc(var(--layout-margin) + var(--content-margin));
	}

	.subtitle {
		opacity: 0.75;
		padding: 50px;
		padding-top: 0px;
		padding-bottom: calc(var(--layout-margin) + var(--layout-margin) + var(--box-margin));
		text-align: center;
		font-size: 25px;
		max-width: 400px;
		text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}

	.subtitle-container {
		width: 100%;
		margin-top: calc(-1 * var(--box-margin));
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.title {
		width: 100%;
		text-align: center;
		font-size: 75px;
		text-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: 30px;
	}

	.how-to-slide {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--layout-margin);
	}

	.how-to-image-container {
		width: 100%;
		max-width: 700px;
		aspect-ratio: 16 / 9;
		display: block;
		position: relative;
		margin-bottom: var(--box-margin);
	}

	.how-to-image {
		width: 100%;
		height: auto;
		display: block;
		user-select: none;
		mask-image: linear-gradient(
				to right,
				transparent 0%,
				rgba(0, 0, 0, 0.3) 8%,
				rgba(0, 0, 0, 0.75) 18%,
				black 30%,
				black 70%,
				rgba(0, 0, 0, 0.75) 82%,
				rgba(0, 0, 0, 0.3) 92%,
				transparent 100%
			),
			linear-gradient(
				to bottom,
				transparent 0%,
				rgba(0, 0, 0, 0.2) 12%,
				rgba(0, 0, 0, 0.6) 25%,
				rgba(0, 0, 0, 0.9) 38%,
				black 50%,
				black 50%,
				rgba(0, 0, 0, 0.9) 62%,
				rgba(0, 0, 0, 0.6) 75%,
				rgba(0, 0, 0, 0.2) 88%,
				transparent 100%
			),
			radial-gradient(ellipse 95% 95% at center, black 55%, transparent 100%);
		mask-composite: intersect;
	}

	.how-to-subtitle {
		position: absolute;
		left: 50%;
		bottom: calc(var(--layout-margin) * 2);
		transform: translateX(-50%);
		text-align: center;
		max-width: 375px;
		padding-inline: var(--layout-margin);
		text-shadow: 0 0 var(--layout-margin) black;
	}

	@media (max-width: 800px) {
		.title {
			font-size: 55px;
		}

		.subtitle {
			max-width: 300px;
		}
	}
</style>
