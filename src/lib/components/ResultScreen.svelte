<script>
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		resultScreenEnabled,
		distanceText,
		motivationText,
		continueText,
		earnedExperience,
		streakText,
		supporterBoost,
		supporterBoostText,
		lastDistance,
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
	let nextRoundButtonElement = $state();

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

	// Go to next round
	function nextRound() {
		if ($tutorial && isFirstTutorialRound) isFirstTutorialRound = false;
		else if ($tutorial && !isFirstTutorialRound) finalizeTutorial();
		transitionToStart();
	}
</script>

{#if showConfetti}
	<div class="confettiBox">
		{#each { length: 4 }, index}
			{@const xVal = 3 + Math.random() * 2}
			{@const yVal = 3 + Math.random() * 2}
			{@const delay = 100 + Math.random() * 300}
			{@const indexFactor = -8 + index * 4}
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

<div class="endBottomArea" style:display={$resultScreenEnabled ? "" : "none"}>
	<div class="endBottomBar">
		<!-- No transition since it would awkwardly trigger on the first result-open -->
		{#if showResultAd}
			<div class="resultAdArea barMenu">
				<div class="resultAd" id="resultAd" data-fuse="Game_Result_incontent_1"></div>
				<p class="noAdvertsText">Purchase a supporter tier to go ad-free.</p>
			</div>
		{/if}
		<div id="resultBox" class="barMenu">
			<div class="resultField" id="motivationText">
				<p>{$motivationText}</p>
			</div>
			{#if showResultAd}
				<div class="mobileResultAdArea resultField">
					<div class="mobileResultAd" id="mobileResultAd" data-fuse="Game_Result_Mob_Only"></div>
					<p class="noAdvertsText">Ad.</p>
				</div>
			{/if}
			{#if $resultScreenEnabled}
				<div class="resultField">
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
					<p id="distanceText">{$distanceText}</p>
				</div>
				{#if $isAuthenticated}
					<div id="experienceArea" class="resultField">
						<div id="supporterBoost" bind:this={$supporterBoost}>
							<p id="supporterBoostText" bind:this={$supporterBoostText}>Supporter Boost (Default)</p>
						</div>
						<p id="endScreenLevelDisplay">Lvl. {level}</p>
						<div id="experienceBarContainer">
							<div
								class="experienceBarResource"
								class:experienceBarTransition={transitionExperienceBar}
								class:experienceBarAnimation={$earnedExperience > 0}
								style:width={percentageWidth}
							></div>
						</div>
						<p id="experienceNumberText">{$animatedExperience.toFixed(0)} XP</p>
						{#if $streakText}
							<div id="streakDisplay">
								<Flame style="margin-right: var(--content-margin);" size={22} strokeWidth={2.25} />
								<p id="endScreenStreakText">{$streakText}</p>
							</div>
						{/if}
					</div>
				{:else}
					<div id="experienceBarNotSignedIn" class="resultField">
						<p id="signupPromptText">
							<button class="signupButton" onclick={signupPrompt}
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
		<div class="barMenu nextRoundArea">
			<button
				class="standardButton white"
				{@attach tooltip({ text: "View panorama" })}
				onclick={() => {
					playSound("basic_button");
					$roundLogPopup = true;
				}}
			>
				<img src="/img/streetview_icon.png" alt="Streetview symbol" class="socialIcon" id="streetviewIcon" />
			</button>
			<button
				bind:this={nextRoundButtonElement}
				id="nextRound"
				class="standardButton white"
				style:pointer-events={$continueText.toLowerCase().includes("wait") ? "none" : ""}
				style:opacity={$continueText.toLowerCase().includes("wait") ? "0.5" : ""}
				{@attach tooltip({
					text: "Ready for the next location?",
					imageSrc: "/img/tutorial/tutorial_next_round.png",
					state: nextRoundTutorialNote,
					zIndex: 13,
					maxWidth: 125,
					showDelay: 3000
				})}
				onclick={() => {
					playSound("basic_button");
					nextRound();
				}}
			>
				<p class="nextRoundText">{$continueText}</p>
				<img src="/img/arrow_icon.png" alt="Arrow" class="directionArrowIcon" />
			</button>
		</div>
	{/if}
</div>

<svelte:window
	onkeypress={(event) => {
		if (event.key === " " && isElementClickable(nextRoundButtonElement) && $resultScreenEnabled) nextRound();
	}}
/>

<style>
	.directionArrowIcon {
		width: 20px;
		height: 20px;
		transform: rotate(270deg);
		vertical-align: -2px;
		margin-right: -10px;
	}

	#streetviewIcon {
		vertical-align: -2px;
	}

	#nextRound {
		padding-inline: 35px;
		flex-grow: 1;
	}

	#resultBox {
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

	.signupButton {
		transition: opacity 250ms ease;
		cursor: pointer;
	}

	.signupButton:hover {
		opacity: 0.5;
	}

	.noAdvertsText {
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

	.resultField {
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

	.endBottomBar {
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

	.endBottomArea {
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

	#motivationText {
		flex-grow: 100;
		min-width: 40%;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.mobileResultAdArea {
		padding: var(--content-margin);
		flex-grow: 1;
	}

	.mobileResultAd {
		overflow: hidden;
		text-align: center;
		width: 320px;
		height: 50px;
	}

	.resultAdArea {
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

	.resultAd {
		width: 728px;
		height: 90px;
		text-align: center;
	}

	#experienceArea {
		position: relative;
		flex-grow: 100;
		min-width: 300px;
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

	#supporterBoost {
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

	#supporterBoostText {
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

	:global(.supporterBoostTextMove) {
		animation: supporterBoostTextMove 2s ease-in-out;
	}

	#experienceBarContainer {
		flex-grow: 10;
		height: var(--layout-margin);
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 7px;
		transition: none;
	}

	#experienceBarNotSignedIn {
		justify-content: space-between;
		max-height: 30px;
	}

	#signupPromptText {
		margin-inline: auto;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.5;
		padding-inline: var(--box-margin);
	}

	.experienceBarResource {
		height: 100%;
		border-radius: 7px;
		background-color: #00cc00;
		width: 0%;
		transition: none;
		box-shadow: var(--bulb-shadow);
	}

	.experienceBarTransition {
		transition: width 1s ease;
	}

	.experienceBarAnimation {
		animation: XPFade 1s ease-in-out;
	}

	#experienceNumberText {
		font-size: 22px;
		width: auto;
		vertical-align: middle;
		text-align: center;
		text-wrap: nowrap;
		flex-grow: 1;
		min-width: 100px;
		padding-inline: var(--panel-margin);
		font-variant-numeric: tabular-nums;
	}

	#endScreenStreakText {
		font-size: 20px;
		vertical-align: middle;
		text-align: center;
		color: white;
		text-wrap: nowrap;
	}

	#streakDisplay {
		margin-right: auto;
		margin-left: var(--panel-margin);
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: row;
		flex-grow: 1;
	}

	#endScreenLevelDisplay {
		font-size: 14px;
		width: auto;
		margin-left: auto;
		vertical-align: middle;
		text-align: center;
		padding-inline: var(--box-margin);
		margin-right: var(--content-margin);
		margin-left: var(--panel-margin);
		color: white;
		background-color: #00cc00;
		box-shadow: var(--bulb-shadow);
		border-radius: 7px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nextRoundArea {
		position: fixed;
		bottom: var(--box-margin);
		right: var(--box-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: 750px;
		margin-inline: auto;
	}

	.nextRoundText {
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

	.confettiBox {
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
		.resultAdArea {
			display: flex;
		}

		.mobileResultAdArea {
			display: none;
		}

		#resultBox {
			width: 722px;
		}
	}

	@media all and (max-width: 1350px) {
		.nextRoundArea {
			width: calc(100% - 36px);
			left: var(--box-margin);
		}

		#resultBox {
			margin-bottom: 66px;
		}
	}
</style>
