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
	import { ArrowRight, ChevronDown, ChevronUp, Play } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { blur, fly } from "svelte/transition";
	import Chip from "./ui/Chip.svelte";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { menuIntroductionNote } from "./TopBar.svelte";
	import { page } from "$app/state";
	import { tutorialStep, tutorial } from "$lib/stores/context-specific/tutorialStore";

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

	// Tour complete / Final slide with path options --------------------------------------------------------------------------

	let howToImage = $state(0);
	let focusedPath = $state(0);
	let wheelLock = false;
	let swipeStartY = null;
	let focusedSectionEl = $state();
	let focusedSectionHeight = $state(0);

	$effect(() => {
		if (!focusedSectionEl) return;
		focusedSectionHeight = focusedSectionEl.offsetHeight;
	});

	function navigatePath(direction) {
		const next = focusedPath + direction;
		if (next < 0 || next >= paths.length) return;
		focusedPath = next;
	}

	function onPathWheel(e) {
		if (wheelLock) return;
		e.preventDefault();
		wheelLock = true;
		setTimeout(() => (wheelLock = false), 300);
		navigatePath(e.deltaY > 0 ? 1 : -1);
	}

	function onPathPointerDown(e) {
		if (e.pointerType !== "touch") return;
		swipeStartY = e.clientY;
	}

	function onPathPointerUp(e) {
		if (e.pointerType !== "touch" || swipeStartY === null) return;
		const dy = e.clientY - swipeStartY;
		swipeStartY = null;
		if (Math.abs(dy) < 30) return;
		navigatePath(dy < 0 ? 1 : -1);
	}

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

	const paths = [
		{
			title: "Learn with fun",
			imageSrc: "/img/tutorial/tutorial_beginner.png",
			options: [
				{
					title: "Play on Famous Places",
					isPlay: true,
					action: () => changeMap("Famous Places", true),
				},
				{
					title: "Play Country Guessr",
					isPlay: true,
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
					isPlay: true,
					action: () => {
						// Only regenerate if not already on World - tutorial end usually defaults to World
						const selectedMap = localStorage.getItem("selectedMap");
						if (selectedMap && selectedMap !== $defaultMap) changeMap($defaultMap, true);
					},
				},
				{
					title: "Browse maps",
					isPlay: false,
					action: () => goto("/maps"),
				},
			],
		},
		{
			title: "Get competitive",
			imageSrc: "/img/tutorial/tutorial_competitions.png",
			options: [
				{
					title: "Multiplayer & friends",
					isPlay: false,
					action: () => goto("/multiplayer"),
				},
				{
					title: "Enter a competition",
					isPlay: false,
					action: () => goto("/competitions"),
				},
			],
		},
	];
</script>

<svelte:window
	onwheel={(e) => $tutorialStep === 3 && onPathWheel(e)}
	onpointerdown={(e) => $tutorialStep === 3 && onPathPointerDown(e)}
	onpointerup={(e) => $tutorialStep === 3 && onPathPointerUp(e)}
/>

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
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Fancy a quick intro to OpenGuessr?</p>
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
					<p class="subtitle" in:blur|global={{ duration: 500 }}>Choose what to explore next.</p>
				</div>
				<div
					class="path-container"
					in:fly|global={{ y: 20, duration: 1000 }}
					style:--focused-section-height="{focusedSectionHeight}px"
				>
					{#each { length: 2 }, index}
						{@const isUp = index === 0}
						<div class="path-nav-container barMenu" class:path-nav-up={isUp} class:path-nav-down={!isUp}>
							<button
								class="standardButton white largeButton"
								disabled={isUp ? focusedPath === 0 : focusedPath === paths.length - 1}
								aria-label={isUp ? "Previous path" : "Next path"}
								onclick={() => {
									playSound("basic_button");
									navigatePath(isUp ? -1 : 1);
								}}
							>
								{#if isUp}
									<ChevronUp size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
								{:else}
									<ChevronDown size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
								{/if}
							</button>
						</div>
					{/each}
					<div class="path-sections-box">
						{#each paths as section, secIdx}
							{@const delta = secIdx - focusedPath}
							{@const isFocused = delta === 0}
							<div
								{@attach (node) => {
									if (isFocused) focusedSectionEl = node;
								}}
								class="path-section barMenu"
								class:focused={isFocused}
								style:transform="translate(-50%, calc(-50% + {delta * 110}%)) scale({isFocused ? 1 : 0.85})"
								style:opacity={Math.abs(delta) > 1 ? 0 : isFocused ? 1 : 0.5}
								style:filter={isFocused ? "" : "blur(3px) brightness(0.5)"}
							>
								<p class="section-title">{section.title}</p>
								<img
									alt="section graphic"
									class="section-image"
									class:section-image-focused={isFocused}
									style:top={secIdx == 0 ? "-110px" : secIdx == 1 ? "-100px" : "-100px"}
									style:right={secIdx == 0 ? "-75px" : secIdx == 2 ? "-85px" : ""}
									style:left={secIdx == 1 ? "-85px" : ""}
									style:rotate={secIdx == 1 ? "-15deg" : secIdx == 2 ? "30deg" : ""}
									src={section.imageSrc}
								/>
								{#each section.options as option, optIdx}
									<div class="path-option">
										<div class="path-option-text-container of-left of-right">
											<p style:text-wrap="nowrap">
												{option.title}
											</p>
											{#if secIdx == 0 && optIdx == 0}<Chip
													italic
													text="Suggested"
												/>
											{/if}
											{#if secIdx == 1 && optIdx == 0}<Chip
													italic
													text="Classic"
												/>
											{/if}
										</div>
										<button
											class="standardButton"
											class:white={!(optIdx == 0 && secIdx == 0)}
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
						{/each}
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
		background-color: var(--dark-background);
		backdrop-filter: blur(var(--normal-blur));
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
		backdrop-filter: none;
	}

	.path-container {
		position: relative;
		width: 100%;
		height: 450px;
		max-height: max(375px, 50dvh);
		z-index: 1;
		touch-action: pan-y;
	}

	.path-sections-box {
		position: absolute;
		inset: 0;
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			rgba(0, 0, 0, 0.15) 4%,
			rgba(0, 0, 0, 0.45) 9%,
			rgba(0, 0, 0, 0.8) 14%,
			black 20%,
			black 80%,
			rgba(0, 0, 0, 0.8) 86%,
			rgba(0, 0, 0, 0.45) 91%,
			rgba(0, 0, 0, 0.15) 96%,
			transparent 100%
		);
	}

	.path-nav-container {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		border-radius: var(--layout-margin);
	}

	.path-nav-up {
		bottom: calc(50% + var(--focused-section-height) / 2 + var(--layout-margin) + var(--content-margin));
	}

	.path-nav-down {
		top: calc(50% + var(--focused-section-height) / 2 + var(--layout-margin) + var(--content-margin));
	}

	.path-section {
		position: absolute;
		left: 50%;
		top: 50%;
		display: flex;
		align-items: center;
		box-shadow: var(--bulb-shadow);
		width: min(500px, calc(100vw - 4 * var(--layout-margin) - 2 * var(--box-margin)));
		box-sizing: border-box;
		border-radius: var(--layout-margin);
		flex-direction: column;
		backdrop-filter: none;
		transition:
			transform 350ms ease,
			opacity 350ms ease,
			filter 350ms ease;
		will-change: transform, opacity, filter;
		pointer-events: none;
	}

	.path-section.focused {
		pointer-events: auto;
	}

	.section-title {
		opacity: 0.75;
		padding: var(--content-margin);
	}

	.section-image {
		position: absolute;
		height: 200px;
		width: 200px;
		pointer-events: none;
		user-select: none;
		filter: brightness(0.9);
	}

	.section-image-focused {
		animation: section-image-pop 350ms 300ms ease-out;
	}

	@keyframes section-image-pop {
		0% {
			scale: 1;
		}
		55% {
			scale: 1.05;
		}
		100% {
			scale: 1;
		}
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
		overflow: hidden;
	}

	.path-option-text-container {
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
		padding: 50px;
		padding-top: 0px;
		padding-bottom: calc(var(--layout-margin) + var(--layout-margin) + var(--box-margin));
		text-align: center;
		font-size: 25px;
		max-width: 400px;
		text-shadow: 0 0 20px rgba(0, 0, 0, 0.35);
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
		text-shadow: 0 0 30px rgba(0, 0, 0, 0.25);
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: calc(var(--layout-margin) * 2);
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
