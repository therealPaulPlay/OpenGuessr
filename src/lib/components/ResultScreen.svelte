<script>
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		resultScreenEnabled,
		distanceText,
		motivationText,
		continueText,
		earnedExperience,
		streakCountText,
		supporterBoost,
		supporterBoostText,
		lastDistance,
		streakMultiplierText,
	} from "$lib/stores/context-specific/resultScreenStore";
	import { isAuthenticated, experience } from "$lib/stores/accountStore";
	import { playSound } from "$lib/utils/soundManager";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
	import { transitionToStart } from "$lib/utils/transitionToStart";
	import { isElementClickable } from "$lib/utils/checkIfElementIsClickable";
	import { tick } from "svelte";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import ResultScreenSlideup from "./ResultScreenSlideup.svelte";
	import ResultFullscreenMessage from "./ResultFullscreenCelebration.svelte";
	import { CircleUser, Flame, MapPinned, RulerDimensionLine } from "@lucide/svelte";
	import { Confetti } from "svelte-confetti";
	import { getMapBounds } from "$lib/utils/getMapBounds";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { registerResultAds } from "$lib/utils/ads";
	import { roundLogPopup } from "$lib/stores/uiStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { finalizeTutorial } from "./TutorialOverlay.svelte";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { countryGuessr } from "$lib/stores/modeStore";

	// Animate experience and level ----------------------------------------------------------------
	const animatedExperience = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		if ($resultScreenEnabled) animatedExperience.set($earnedExperience);
		else animatedExperience.set(0);
	});

	let level = $state(1);
	let percentageWidth = $state("0%");
	let showConfetti = $state(false);
	let continueButtonEl = $state();

	let transitionExperienceBar = $state(true);
	let lastPercentageWidthNumber;

	experience.subscribe((_value) => {
		level = getLevel();

		const percentageWidthNumber = Math.max(7, getLevelFraction() * 100); // Minimum 7% to prevent weird thin line
		const leveledUp = lastPercentageWidthNumber > percentageWidthNumber;
		lastPercentageWidthNumber = percentageWidthNumber;

		if (leveledUp) {
			// On level-up: snap to 0% without transition, then animate to the new value
			// Double rAF ensures the browser paints the 0% state before the transition starts
			transitionExperienceBar = false;
			percentageWidth = "0%";
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					transitionExperienceBar = true;
					percentageWidth = percentageWidthNumber + "%";
				});
			});
		} else {
			transitionExperienceBar = true;
			percentageWidth = percentageWidthNumber + "%";
		}
	});

	// Trigger confetti
	$effect(() => {
		if ($resultScreenEnabled && $lastDistance < 1000 * (getMapBounds().diameter / 360)) showConfetti = true;
		else showConfetti = false;
	});

	// Tutorial next round note --------------------------------------------------------------------------

	// Tutorial note for going to the next round
	let isFirstTutorialRound = $state(true);
	let nextRoundTutorialNote = $state({ visible: false });

	$effect(() => {
		if (!$tutorial) isFirstTutorialRound = true; // Reset to default on tutorial end
		if ($tutorial && $resultScreenEnabled && isFirstTutorialRound) nextRoundTutorialNote.visible = true;
		if (!$resultScreenEnabled) nextRoundTutorialNote.visible = false;
	});

	// Ads ------------------------------------------------------------------------------------------

	// Register result ads when the result screen has at least been visible once
	let resultEnabledOnceSinceAdsEnabled = $state(false);
	let showResultAd = $derived(!$adsDisabled && resultEnabledOnceSinceAdsEnabled);

	$effect(() => {
		// Effect since this should also fire if user is currently on the result screen and adsDisabled becomes false
		if ($resultScreenEnabled && !$adsDisabled) resultEnabledOnceSinceAdsEnabled = true;
	});

	adsDisabled.subscribe((value) => {
		// Disable if ads are disabled, so that when ads are re-enabled, the re-registration happens when the result is open
		if (!value) resultEnabledOnceSinceAdsEnabled = false;
	});

	$effect(async () => {
		if (showResultAd) {
			await tick();
			registerResultAds();
		}
	});

	// Next round ---------------------------------------------------------------------------------
	function nextRound() {
		// Tutorial state
		if ($tutorial) {
			if (isFirstTutorialRound) isFirstTutorialRound = false;
			else finalizeTutorial();
		}

		// Go to next round
		transitionToStart();
	}
</script>

{#if showConfetti}
	<div class="confetti-box">
		{#each { length: 4 }, index}
			{const xVal = 3 + Math.random() * 2}
			{const yVal = 3 + Math.random() * 2}
			{const delay = 100 + Math.random() * 300}
			{const indexFactor = -8 + index * 4}
			<Confetti
				noGravity
				x={[-xVal + indexFactor, xVal + indexFactor]}
				y={[-yVal, yVal]}
				amount={35}
				delay={[delay, delay + 100]}
				colorRange={[0, 10]}
				duration={1500}
			/>
		{/each}
	</div>
{/if}

{#if $resultScreenEnabled}
	<ResultFullscreenMessage />
	<ResultScreenSlideup />
{/if}

<!-- Allow pressing space to continue -->
<svelte:window
	onkeyup={(event) => {
		if (event.key === " " && isElementClickable(continueButtonEl) && $resultScreenEnabled) nextRound();
	}}
/>

<div class="end-bottom-area" style:display={$resultScreenEnabled ? "" : "none"}>
	<div class="end-bottom-bar">
		<!-- No transition since it would awkwardly trigger on the first result-open -->
		{#if showResultAd}
			<div class="result-ad-area bar-menu">
				<div class="result-ad" id="result-ad" data-fuse="Game_Result_incontent_1"></div>
				<p class="no-adverts-text">Purchase a supporter tier to go ad-free.</p>
			</div>
		{/if}
		<div id="result-box" class="bar-menu">
			<div class="result-field" id="motivation-text">
				<p>{$motivationText}</p>
			</div>
			{#if showResultAd}
				<div class="mobile-result-ad-area result-field">
					<div class="mobile-result-ad" id="mobile-result-ad" data-fuse="Game_Result_Mob_Only"></div>
					<p class="no-adverts-text">Ad.</p>
				</div>
			{/if}
			{#if $resultScreenEnabled}
				<div class="result-field">
					<!-- Distance is usually number + unit, but Country Guessr just has Correct/Wrong -->
					{#if $countryGuessr}
						<MapPinned class="distance-icon" style="margin-right: var(--panel-margin)" size={22} strokeWidth={2.25} />
					{:else}
						<RulerDimensionLine
							class="distance-icon"
							style="margin-right: var(--panel-margin)"
							size={22}
							strokeWidth={2.25}
						/>
					{/if}
					<p id="distance-text">{$distanceText}</p>
				</div>
				{#if $isAuthenticated}
					<div id="experience-area" class="result-field">
						<div id="supporter-boost" bind:this={$supporterBoost}>
							<p id="supporter-boost-text" bind:this={$supporterBoostText}>Supporter Boost (Default)</p>
						</div>
						<p id="end-screen-level-display">Lvl. {level}</p>
						<div id="experience-bar-container">
							<div
								class="experience-bar-resource"
								class:experience-bar-transition={transitionExperienceBar}
								class:experience-bar-animation={$earnedExperience > 0}
								style:width={percentageWidth}
							></div>
						</div>
						<p id="experience-number-text">+ {$animatedExperience.toFixed(0)} XP</p>
						{#if $streakCountText && $streakMultiplierText}
							<div id="streak-display">
								<Flame style="margin-right: 2px; flex-shrink: 0;" size={22} strokeWidth={2.25} />
								<p id="end-screen-streak-text">
									{$streakCountText} <span class="streak-multiplier-text">({$streakMultiplierText})</span>
								</p>
							</div>
						{/if}
					</div>
				{:else}
					<div id="experience-bar-not-signed-in" class="result-field">
						<p id="signup-prompt-text">
							<button class="signup-button" onclick={signupPrompt}
								><CircleUser style="margin-bottom: -3px; margin-right: 3px;" strokeWidth={2.25} size={22} /> Sign up to see
								& save your score!
							</button>
						</p>
					</div>
				{/if}
			{/if}
		</div>
	</div>
	{#if $resultScreenEnabled}
		<div class="bar-menu next-round-area">
			<button
				class="standard-button white"
				{@attach tooltip({ text: "View panorama" })}
				onclick={() => {
					playSound("basic_button");
					$roundLogPopup = true;
				}}
			>
				<img src="/img/streetview_icon.png" alt="Streetview symbol" id="streetview-icon" />
			</button>
			<button
				bind:this={continueButtonEl}
				id="next-round"
				class="standard-button white"
				style:pointer-events={$continueText.toLowerCase().includes("wait") ? "none" : ""}
				style:opacity={$continueText.toLowerCase().includes("wait") ? "0.5" : ""}
				{@attach tooltip({
					text: "Ready for the next location?",
					imageSrc: "/img/tutorial/tutorial_next_round.png",
					state: nextRoundTutorialNote,
					zIndex: 13,
					maxWidth: 125,
					showDelay: 3000,
				})}
				onclick={() => {
					playSound("basic_button");
					nextRound();
				}}
			>
				<p class="next-round-text">{$continueText}</p>
				<img src="/img/arrow_icon.png" alt="Arrow" class="direction-arrow-icon" />
			</button>
		</div>
	{/if}
</div>

<style>
	.direction-arrow-icon {
		width: 20px;
		height: 20px;
		transform: rotate(270deg);
		vertical-align: -2px;
		margin-right: -10px;
		user-select: none;
		pointer-events: none;
	}

	#streetview-icon {
		vertical-align: -2px;
		width: 20px;
		height: auto;
		user-select: none;
		pointer-events: none;
	}

	#next-round {
		padding-inline: 35px;
		flex-grow: 1;
	}

	#result-box {
		display: flex;
		justify-content: center;
		/* Stretch to ensure each result field fills the vertical space available */
		align-items: stretch;
		color: white;
		width: 750px;
		flex-wrap: wrap;
		gap: var(--panel-margin);
		padding: var(--panel-margin);
		margin-inline: var(--box-margin);
	}

	.signup-button {
		transition: opacity 250ms ease;
		cursor: pointer;
	}

	.signup-button:hover {
		opacity: 0.5;
	}

	.no-adverts-text {
		position: absolute;
		text-align: center;
		color: white;
		opacity: 0.25;
		z-index: -1;
		left: 50%;
		top: 50%;
		text-wrap: nowrap;
		transform: translate(-50%, -50%);
	}

	.result-field {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.075);
		border-radius: var(--content-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		flex-grow: 10;
		position: relative;
		transition:
			width 250ms ease,
			height 250ms ease;
		overflow: hidden;
	}

	.end-bottom-bar {
		display: flex;
		justify-content: center;
		align-items: center;
		height: fit-content;
		flex: 1;
		pointer-events: none;
		position: fixed;
		bottom: var(--box-margin);
		left: 0;
		right: 0;
	}

	.end-bottom-area {
		position: fixed;
		height: fit-content;
		display: flex;
		bottom: 0;
		left: 0;
		right: 0;
		top: 0;
		flex-direction: column;
		overflow: hidden;
		z-index: 13;
		pointer-events: none;
	}

	#motivation-text {
		flex-grow: 100;
		min-width: 40%;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.mobile-result-ad-area {
		padding: var(--content-margin);
		flex-grow: 1;
	}

	.mobile-result-ad {
		overflow: hidden;
		text-align: center;
		width: 320px;
		height: 50px;
	}

	.result-ad-area {
		width: 728px;
		height: 90px;
		display: none;
		justify-content: center;
		align-items: center;
		position: absolute;
		left: 50%;
		top: calc(-90px - var(--box-margin) * 2);
		transform: translate(-50%, 0);
		padding: var(--content-margin);
		pointer-events: auto;
	}

	.result-ad {
		width: 728px;
		height: 90px;
		text-align: center;
	}

	#experience-area {
		position: relative;
		flex-grow: 100;
		min-width: 300px;
		gap: var(--box-margin);
	}

	@keyframes XPFade {
		0% {
			filter: brightness(1) contrast(1);
		}

		50% {
			filter: brightness(1.75) contrast(0.5);
		}

		100% {
			filter: brightness(1) contrast(1);
		}
	}

	#supporter-boost {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(21, 26, 32, 0.5);
		transition: opacity 250ms ease;
		pointer-events: none;
		opacity: 0;
		z-index: 2;
		border-radius: 7px;
	}

	#supporter-boost-text {
		opacity: 0;
	}

	@keyframes supporterBoostTextMove {
		0% {
			opacity: 0;
			transform: translateX(-100%);
		}

		20% {
			opacity: 1;
			transform: translateX(0);
		}

		80% {
			opacity: 1;
			transform: translateX(0);
		}

		100% {
			opacity: 0;
			transform: translateX(100%);
		}
	}

	:global(.supporter-boost-text-move) {
		animation: supporterBoostTextMove 2s ease-in-out;
	}

	#experience-bar-container {
		flex-grow: 10;
		height: var(--layout-margin);
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 7px;
		transition: none;
	}

	#experience-bar-not-signed-in {
		justify-content: space-between;
		max-height: 30px;
	}

	#signup-prompt-text {
		margin-inline: auto;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.5;
		padding-inline: var(--box-margin);
	}

	.experience-bar-resource {
		height: 100%;
		border-radius: 7px;
		background-color: #00cc00;
		width: 0%;
		transition: none;
		box-shadow: var(--bulb-shadow);
	}

	.experience-bar-transition {
		transition: width 1s ease;
	}

	.experience-bar-animation {
		animation: XPFade 1s ease-in-out;
	}

	#experience-number-text {
		font-size: 22px;
		text-align: center;
		text-wrap: nowrap;
		min-width: 100px;
		font-variant-numeric: tabular-nums;
	}

	#end-screen-streak-text {
		font-size: 20px;
		vertical-align: middle;
		text-align: center;
		color: white;
		text-wrap: nowrap;
	}

	.streak-multiplier-text {
		opacity: 0.5;
		text-wrap: nowrap;
		margin-left: 2px;
	}

	#streak-display {
		margin-right: var(--content-margin);
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: row;
	}

	#end-screen-level-display {
		font-size: 14px;
		width: auto;
		vertical-align: middle;
		text-align: center;
		padding-inline: var(--box-margin);
		margin-left: var(--content-margin);
		color: white;
		background-color: #00cc00;
		box-shadow: var(--bulb-shadow);
		border-radius: 7px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.next-round-area {
		position: fixed;
		bottom: var(--box-margin);
		right: var(--box-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: 750px;
		margin-inline: auto;
	}

	.next-round-text {
		display: inline;
	}

	@keyframes distanceIconJelly {
		0%,
		100% {
			transform: scaleX(1);
		}
		40% {
			transform: scaleX(1.25);
		}
		70% {
			transform: scaleX(0.85);
		}
	}

	:global(.distance-icon) {
		animation: distanceIconJelly 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.confetti-box {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 13;
		pointer-events: none;
		overflow: hidden;
	}

	@media (min-width: 1900px) {
		.result-ad-area {
			display: flex;
		}

		.mobile-result-ad-area {
			display: none;
		}

		#result-box {
			width: 722px;
		}
	}

	@media all and (max-width: 1350px) {
		.next-round-area {
			width: calc(100% - 36px);
			left: var(--box-margin);
		}

		#result-box {
			margin-bottom: 66px;
		}
	}
</style>
