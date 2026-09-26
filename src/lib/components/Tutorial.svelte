<script module>
	// Start ---------------------------------------------------------------
	export function checkTutorialStart() {
		if (localStorage.getItem("tutorialCompleted") !== null) return tutorialStep.set(0); // Tutorial alr completed
		mainMenu.set(false);
		tutorialStep.set(1);
	}

	// Completion ----------------------------------------------------------
	// Marks the tutorial completed and shows an optional last step
	export function markTutorialCompleted(step = 0) {
		tutorialStep.set(step);
		tutorial.set(false);
		localStorage.setItem("tutorialCompleted", true);
	}

	// Leave ---------------------------------------------------------------
	export function leaveTutorial() {
		clearTimeout(finishTimeout);
		markTutorialCompleted();

		// In case this gets triggered because we enter multiplayer or a comp, don't regenerate and only change the map
		if (localStorage.getItem("selectedMap") === get(tutorialMap)) changeMap(get(defaultMap), get(singleplayer));

		// Bring back to main menu
		mainMenu.set(true);
	}

	// Needed for linkjoin, for invites (you can sign up via the result screen), and for users that visit pages such as /competitions directly
	singleplayer.subscribe((value) => {
		if (!value && (get(tutorialStep) > 0 || get(tutorial))) leaveTutorial(); // Marks tutorial as completed (users who e.g. navigate to custom page now what they are doing)
	});

	// Finalization ----------------------------------------------------
	let finishTimeout;
	let finalizeOnNewRound = false;

	// Check for finalization on each round start
	resultScreenEnabled.subscribe((value) => {
		if (!value && finalizeOnNewRound) {
			finalizeOnNewRound = false;
			finishTimeout = setTimeout(() => markTutorialCompleted(3), 150);
		}
	});

	export function finalizeTutorial() {
		if (!get(tutorial)) console.warn("Cannot finalize tutorial, not active.");
		changeMap(get(defaultMap)); // Change without regenerating
		finalizeOnNewRound = true;
	}
</script>

<script>
	import { defaultMap, tutorialMap } from "$lib/stores/context-specific/officialMapsStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { changeMap } from "$lib/utils/changeMapUtils";
	import { playSound } from "$lib/utils/soundManager";
	import { ArrowRight } from "@lucide/svelte";
	import { get } from "svelte/store";
	import { blur, fly } from "svelte/transition";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { tutorialStep, tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { mainMenu } from "$lib/stores/uiStore";

	// How to ----------------------------------------------------------------------
	let howToImage = $state(0);

	const howToSlides = [
		{
			image: "/img/tutorial/help_image_1.jpg",
			alt: "Look at the panorama",
			description: "Start by looking for clues in the panorama image.",
		},
		{
			image: "/img/tutorial/help_image_2.jpg",
			alt: "Guess where you are",
			description: "When ready, pinpoint the location on the map — the closer, the better.",
		},
	];
</script>

<div class="tutorial-scroll">
	<div class="content">
		{#if $tutorialStep == 1}
			<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>Welcome, explorer!</h1>
			<div class="subtitle-container">
				<p class="subtitle" in:blur|global={{ duration: 500 }}>Fancy a quick intro to OpenGuessr?</p>
			</div>
			<div class="action-container">
				<div class="action-button-panel bar-menu" in:fly|global={{ y: 20, duration: 1000 }}>
					<button
						class="standard-button large-button"
						onclick={() => {
							playSound("basic_button");
							$tutorial = true;
							$tutorialStep = 2;
						}}
					>
						Start tutorial
						<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
					</button>
				</div>
				<button
					class="subtle-button"
					in:fly|global={{ y: 20, duration: 1000 }}
					onclick={() => {
						playSound("basic_button");
						leaveTutorial();
					}}
				>
					No, skip to menu
				</button>
			</div>
		{:else if $tutorialStep == 2}
			<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>How to play</h1>
			{#key howToImage}
				<div class="how-to-image-container" in:blur|global={{ duration: 500 }}>
					<img class="how-to-image" src={howToSlides[howToImage].image} alt={howToSlides[howToImage].alt} />
					<p class="how-to-subtitle">{howToSlides[howToImage].description}</p>
				</div>
			{/key}
			<div class="action-container">
				<div class="action-button-panel bar-menu" in:fly|global={{ y: 20, duration: 1000 }}>
					<button
						class="standard-button large-button"
						onclick={() => {
							playSound("basic_button");
							if (howToImage < howToSlides.length - 1) howToImage++;
							else {
								changeMap($tutorialMap, true);
								$tutorialStep = 0;
							}
						}}
					>
						{howToImage < howToSlides.length - 1 ? "Next" : "Let's play"}
						<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
					</button>
				</div>
			</div>
		{:else if $tutorialStep == 3}
			<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>Tutorial complete!</h1>
			<div class="subtitle-container">
				<p class="subtitle" in:blur|global={{ duration: 500 }}>Now, explore at your own pace.</p>
			</div>
			<div class="action-container">
				<div class="action-button-panel bar-menu" in:fly|global={{ y: 20, duration: 1000 }}>
					<button
						class="standard-button large-button"
						onclick={() => {
							playSound("basic_button");
							leaveTutorial();
						}}
					>
						Let's go
						<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.tutorial-scroll {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		align-content: center;
		display: block;
		padding: var(--layout-margin);
		overflow-y: auto;
	}

	.action-container {
		display: flex;
		justify-content: stretch;
		align-items: center;
		gap: var(--layout-margin);
		flex-direction: column;
	}

	.action-button-panel {
		border-radius: var(--layout-margin);
	}

	.subtle-button {
		padding-inline: var(--content-margin);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 250ms ease;
		text-shadow: 0 0 10px var(--dark-shadow-color);
	}

	.subtle-button:hover {
		opacity: 0.25;
	}

	.content {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		gap: calc(var(--layout-margin) + var(--content-margin));
		padding-top: var(--layout-margin);
		padding-bottom: var(--layout-margin);
	}

	.subtitle {
		opacity: 0.75;
		padding-inline: var(--layout-margin);
		padding-bottom: calc(var(--layout-margin) + var(--layout-margin) + var(--box-margin));
		text-align: center;
		margin-inline: auto;
		font-size: 25px;
		max-width: 400px;
		text-shadow: 0 0 20px var(--dark-shadow-color);
		text-wrap: balance;
	}

	.subtitle-container {
		margin-top: calc(-1 * var(--box-margin));
	}

	.title {
		text-align: center;
		font-size: 75px;
		text-shadow: 0 0 30px var(--dark-shadow-color);
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: var(--layout-margin);
		width: fit-content;
	}

	.how-to-image-container {
		width: 700px;
		max-width: 100%;
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
		pointer-events: none;
		mask-image:
			linear-gradient(
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
		padding-inline: calc(var(--layout-margin) * 2);
		width: 100%;
		box-sizing: border-box;
		text-shadow: 0 0 var(--layout-margin) var(--dark-shadow-color);
	}

	@media (max-width: 800px) {
		.title {
			font-size: 45px;
		}

		.subtitle {
			max-width: 300px;
		}
	}
</style>
