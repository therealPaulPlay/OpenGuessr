<script module>
	export function leaveTutorial() {
		clearTimeout(finishTimeout);
		tutorialStep.set(0);
		localStorage.setItem("tutorialCompleted", true);

		// If tutorial was true, regenerate with default map
		if (get(tutorial)) {
			tutorial.set(false);
			// In case this gets triggered because we enter multiplayer or a comp, don't regenerate and only change the map
			changeMap(get(defaultMap), get(singleplayer));
		}
	}

	let finishTimeout;
	let finalizeOnNewRound = false;

	// Check for finalization for each round start
	resultScreenEnabled.subscribe((value) => {
		if (!value && finalizeOnNewRound) {
			finalizeOnNewRound = false;
			finishTimeout = setTimeout(() => {
				tutorialStep.set(3);
				localStorage.setItem("tutorialCompleted", true);
				tutorial.set(false);
			}, 150);
		}
	});

	export function finalizeTutorial() {
		if (!get(tutorial)) console.warn("Cannot finalize tutorial, not active.");
		changeMap(get(defaultMap)); // Change to default without regenerating
		finalizeOnNewRound = true;
	}
</script>

<script>
	import { goto } from "$app/navigation";

	import { defaultMap, tutorialMap } from "$lib/stores/context-specific/officialMapsStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { changeMap } from "$lib/utils/changeMap";
	import { playSound } from "$lib/utils/soundManager";
	import { ArrowRight, Play } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { blur, fly } from "svelte/transition";
	import Chip from "./ui/Chip.svelte";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { menuIntroductionNote } from "./TopBar.svelte";
	import { page } from "$app/state";
	import { tutorialStep, tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { navigationMenu } from "$lib/stores/uiStore";

	// Check for tutorial state & start
	onMount(() => {
		const tutorialCompleted = !(localStorage.getItem("tutorialCompleted") === null);

		// Temporary backwards-compatability guard (old, now removed menu introduction seen -> count as tutorial played)
		// TODO remove in 30 days
		if (localStorage.getItem("menuIntroduction")) {
			localStorage.setItem("tutorialCompleted", true);
			$tutorialStep = 0;
			return;
		}

		$tutorialStep = tutorialCompleted ? 0 : 1; // 0 means off, 1 shows the first step
	});

	// If the user leaves singleplayer while the overlay is shown or the tutorial is active, leave tutorial
	// Also needed for linkjoin, for invites (you can sign up via the result screen), and for users that visit pages such as /competitions directly
	singleplayer.subscribe((value) => {
		if (!value && ($tutorialStep > 0 || $tutorial)) leaveTutorial(); // Mark tutorial as completed, users that go straight to e.g. competitions know what they are doing
	});

	let howToImage = $state(0);

	const howToSlides = [
		{
			image: "/img/help_image_1.jpg",
			alt: "Look at the panorama",
			description: "Look for clues in the panorama.",
		},
		{
			image: "/img/help_image_2.jpg",
			alt: "Guess where you are",
			description: "Pinpoint the location on the map — the closer, the higher the score.",
		},
	];

	const finalPaths = [
		{
			title: "Famous places",
			isPlay: true,
			action: () => changeMap("Famous Places", true),
		},
		{
			title: "Multiplayer & friends",
			isPlay: false,
			action: () => goto("/multiplayer"),
		},
		{
			title: "Browse menu",
			isPlay: false,
			action: () => setTimeout(() => ($navigationMenu = true), 250),
		},
	];
</script>

{#if $tutorialStep > 0}
	<div
		class="tutorial-overlay"
		in:blur
		out:blur={{ duration: 250 }}
		style:display={page.url.pathname !== "/" ? "none" : ""}
	>
		<div class="content">
			{#if $tutorialStep == 1}
				<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>Welcome, explorer!</h1>
				<div class="subtitle-container">
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Fancy a fun introduction to OpenGuessr?</p>
				</div>
				<div class="action-container">
					<div class="action-button-panel barMenu" in:fly|global={{ y: 20, duration: 1000 }}>
						<button
							class="standardButton largeButton"
							onclick={() => {
								playSound("basic_button");
								$tutorial = true; // Set tutorial to disable notification accept and others ways to leave & end up in unintended states
								$tutorialStep = 2;
							}}
						>
							Start the tour
							<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
						</button>
					</div>
					<button class="subtle-button" in:fly|global={{ y: 20, duration: 1000 }} onclick={leaveTutorial}>
						No, skip tour
					</button>
				</div>
			{:else if $tutorialStep == 2}
				<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>How to play</h1>
				{#key howToImage}
					<div class="how-to-slide">
						<div class="how-to-image-container" in:blur|global={{ duration: 500 }}>
							<img class="how-to-image" src={howToSlides[howToImage].image} alt={howToSlides[howToImage].alt} />
							<p class="how-to-subtitle" in:blur|global={{ duration: 500 }}>
								{howToSlides[howToImage].description}
							</p>
						</div>
					</div>
				{/key}
				<div class="action-container">
					<div class="action-button-panel barMenu" in:fly|global={{ y: 20, duration: 1000 }}>
						<button
							class="standardButton largeButton"
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
				<h1 class="title" in:fly|global={{ y: -20, duration: 1000 }}>Tour completed!</h1>
				<div class="subtitle-container">
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Pick your next adventure.</p>
				</div>
				<div class="path-container barMenu" in:fly|global={{ y: 20, duration: 1000 }}>
					{#each finalPaths as option, idx}
						<div class="path-box">
							<div class="path-box-text-container of-left of-right">
								<p style:text-wrap="nowrap">{option.title}</p>
								{#if idx === 0}<Chip italic red mutedOpacity={false} text="Suggested" />{/if}
							</div>
							<button
								class="standardButton"
								class:white={idx !== 0}
								style:z-index="1"
								onclick={() => {
									playSound("basic_button");
									$tutorialStep = 0;
									if (option.isPlay) menuIntroductionNote.visible = true;
									option.action();
								}}
							>
								{#if option.isPlay}
									<Play style="margin-bottom: -2px;" size={22} strokeWidth={2.25} />
								{:else}
									<ArrowRight style="margin-bottom: -2px;" size={22} strokeWidth={2.25} />
								{/if}
							</button>
						</div>
					{/each}
				</div>
				<div class="action-container">
					<div class="action-button-panel barMenu" in:fly|global={{ y: 20, duration: 1000 }}>
						<button
							class="standardButton white largeButton close-button"
							onclick={() => {
								playSound("basic_button");
								$tutorialStep = 0;
								menuIntroductionNote.visible = true;
							}}
						>
							Close
						</button>
					</div>
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
		padding: var(--layout-margin);
		background-color: var(--dark-background);
		backdrop-filter: blur(var(--weak-blur));
	}

	.action-container {
		display: flex;
		justify-content: stretch;
		align-items: center;
		gap: var(--layout-margin);
		flex-direction: column;
		width: 100%;
	}

	.action-button-panel {
		border-radius: var(--layout-margin);
	}

	.path-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		box-sizing: border-box;
		border-radius: var(--layout-margin);
		margin-bottom: var(--box-margin);
	}

	.path-box {
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
		overflow: hidden;
	}

	.path-box-text-container {
		scrollbar-width: none;
		overflow-x: auto;
		margin-left: var(--content-margin);
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		padding-top: var(--content-margin);
		padding-bottom: var(--content-margin);
		padding-right: var(--content-margin);
	}

	.close-button {
		padding-inline: var(--layout-margin);
	}

	.subtle-button {
		padding-inline: var(--content-margin);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 250ms ease;
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
	}

	.subtle-button:hover {
		opacity: 0.25;
	}

	.content {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
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
		text-shadow: 0 0 20px rgba(0, 0, 0, 0.35);
		text-wrap: balance;
	}

	.subtitle-container {
		width: 100%;
		margin-top: calc(-1 * var(--box-margin));
	}

	.title {
		width: 100%;
		text-align: center;
		font-size: 75px;
		text-shadow: 0 0 30px rgba(0, 0, 0, 0.25);
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: var(--layout-margin);
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
		padding-inline: calc(var(--layout-margin) * 2);
		width: 100%;
		box-sizing: border-box;
		text-shadow: 0 0 var(--layout-margin) black;
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
