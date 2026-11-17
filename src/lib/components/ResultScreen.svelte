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
	import { tooltip } from "openguessr-ui";
	import { registerResultAds } from "$lib/utils/ads";
	import { inMenu, roundLogPopup } from "$lib/stores/uiStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { evolveTutorial } from "./Tutorial.svelte";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { countryGuessr } from "$lib/stores/modeStore";
	import { mapBounds } from "$lib/stores/locationStore";

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
	let fillingToLevelUp = $state(false);
	let lastPercentageWidthNumber;
	let levelUpTimeout;

	function setExperienceBar(percentage, { transition = true, filling = false } = {}) {
		transitionExperienceBar = transition;
		fillingToLevelUp = filling;
		percentageWidth = percentage + "%";
	}

	experience.subscribe((_value) => {
		const percentageWidthNumber = Math.max(7, getLevelFraction() * 100); // Minimum 7% to prevent weird thin line
		const leveledUp = lastPercentageWidthNumber > percentageWidthNumber;
		lastPercentageWidthNumber = percentageWidthNumber;

		clearTimeout(levelUpTimeout);

		if (leveledUp) {
			// On level-up, quickly fill the bar to 100%, then snap to 0% without transition and animate to the new value
			setExperienceBar(100, { filling: true });

			levelUpTimeout = setTimeout(() => {
				setExperienceBar(0, { transition: false });
				level = getLevel();

				// Double rAF ensures the browser paints the 0% state before the transition starts
				requestAnimationFrame(() => {
					requestAnimationFrame(() => setExperienceBar(percentageWidthNumber));
				});
			}, 400);
		} else {
			level = getLevel();
			setExperienceBar(percentageWidthNumber);
		}
	});

	// Trigger confetti
	$effect(() => {
		if ($resultScreenEnabled && $lastDistance < 1000 * ($mapBounds.diameter / 360)) showConfetti = true;
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

	// Only play ruler animation once on result open, not on menu closes -----------------------------
	let distanceIconAnimated = $state(false);

	$effect(() => {
		if ($resultScreenEnabled) distanceIconAnimated = true;
	});

	// Only transition the result area when coming from or entering the menu --------------------------
	let fadeBottomArea = $state(false);

	inMenu.subscribe(() => (fadeBottomArea = true));
	resultScreenEnabled.subscribe(() => (fadeBottomArea = false));

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
			else evolveTutorial();
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

<!-- Display: none to ensure ads are not rendered, but kept mounted to avoid constant re-registration -->
<div
	class="end-bottom-area"
	class:display-hidden={!$resultScreenEnabled || $inMenu}
	class:bottom-area-fade={fadeBottomArea}
>
	<div class="end-bottom-bar safe-margin-bottom">
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
				<div
					class="result-field"
					class:distance-icon-animated={distanceIconAnimated}
					onanimationend={() => (distanceIconAnimated = false)}
				>
					<!-- Distance is usually number + unit, but Country Guessr just has Correct/Wrong -->
					{#if $countryGuessr}
						<MapPinned
							class="distance-icon"
							style="margin-right: var(--panel-margin); flex-shrink: 0;"
							size={22}
							strokeWidth={2.25}
						/>
					{:else}
						<RulerDimensionLine
							class="distance-icon"
							style="margin-right: var(--panel-margin); flex-shrink: 0;"
							size={22}
							strokeWidth={2.25}
						/>
					{/if}
					<p class="distance-text">{$distanceText}</p>
				</div>
				{#if $isAuthenticated}
					<div class="result-field large-min-width">
						<div id="supporter-boost" bind:this={$supporterBoost}>
							<p id="supporter-boost-text" bind:this={$supporterBoostText}>Supporter Boost (Default)</p>
						</div>
						<div class="of-left of-right experience-area-inner">
							<p id="end-screen-level-display" class="content-shadow">Lvl. {level}</p>
							<div id="experience-bar-container">
								<div
									class="experience-bar-resource"
									class:experience-bar-transition={transitionExperienceBar}
									class:experience-bar-animation={$earnedExperience > 0}
									style:width={percentageWidth}
									style:transition-duration={fillingToLevelUp ? "400ms" : null}
									style:transition-timing-function={fillingToLevelUp ? "ease-in" : null}
								></div>
							</div>
							<p id="experience-number-text">+ {$animatedExperience.toFixed(0)} XP</p>
							{#if $streakCountText && $streakMultiplierText}
								<div id="streak-display">
									<Flame style="margin-right: 2px; flex-shrink: 0;" size={22} strokeWidth={2.25} />
									<p>{$streakCountText} <span class="streak-multiplier-text">({$streakMultiplierText})</span></p>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="result-field large-min-width">
						<button class="signup-button" onclick={signupPrompt}
							><CircleUser style="margin-bottom: -3px; margin-right: 3px;" strokeWidth={2.25} size={22} /> Sign up to see
							& save your score!
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
	{#if $resultScreenEnabled}
		<div class="bar-menu next-round-area safe-margin-bottom">
			<button
				class="standard-button bright"
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
				class="standard-button bright"
				style:pointer-events={$continueText.toLowerCase().includes("wait") ? "none" : ""}
				style:opacity={$continueText.toLowerCase().includes("wait") ? "0.5" : ""}
				{@attach tooltip({
					text: "Ready for the next location?",
					imageSrc: "/img/tutorial/tutorial_next_round.png",
					state: nextRoundTutorialNote,
					zIndex: 13,
					maxWidth: 150,
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
		justify-content: safe center;
		/* Stretch to ensure each result field fills the vertical space available */
		align-items: stretch;
		color: white;
		width: calc(750px + var(--panel-margin) * 2);
		flex-wrap: wrap;
		gap: var(--panel-margin);
		padding: var(--panel-margin);
		margin-inline: var(--box-margin);
		max-width: calc(100% - var(--box-margin) * 2);
		overflow: hidden;
	}

	.signup-button {
		opacity: 0.5;
		transition: opacity 250ms ease;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding-inline: var(--box-margin);
	}

	.signup-button:hover {
		opacity: 0.25;
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
		justify-content: safe center;
		align-items: safe center;
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
		z-index: 13;
	}

	.bottom-area-fade {
		transition: display 250ms allow-discrete;
	}

	.bottom-area-fade .bar-menu {
		transition:
			opacity 250ms cubic-bezier(0.65, 0, 0.35, 1),
			filter 250ms cubic-bezier(0.65, 0, 0.35, 1);
	}

	.display-hidden {
		display: none;
	}

	.display-hidden .bar-menu {
		opacity: 0;
		filter: blur(var(--weak-blur));
	}

	@starting-style {
		.bottom-area-fade .bar-menu {
			opacity: 0;
			filter: blur(var(--weak-blur));
		}
	}

	#motivation-text {
		flex-grow: 100;
		min-width: 40%;
		text-align: center;
	}

	.distance-text {
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.mobile-result-ad-area {
		padding: var(--content-margin);
		flex-grow: 1;
	}

	.result-ad-area {
		width: calc(720px + var(--box-margin));
		height: calc(90px + var(--box-margin));
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
		/* Overflow hidden and contain paint to stop basic misconfigured ads */
		overflow: hidden;
		contain: layout paint;
		width: 728px;
		height: 90px;
		text-align: center;
	}

	.mobile-result-ad {
		/* Overflow hidden and contain paint to stop basic misconfigured ads */
		overflow: hidden;
		contain: layout paint;
		text-align: center;
		width: 320px;
		height: 50px;
	}

	.experience-area-inner {
		display: flex;
		justify-content: safe center;
		align-items: safe center;
		gap: var(--box-margin);
		overflow-x: auto;
		scrollbar-width: none;
		width: 100%;
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
		min-width: 40px;
	}

	.large-min-width {
		min-width: 75%;
		position: relative;
		flex-grow: 100;
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

	.streak-multiplier-text {
		opacity: 0.5;
		margin-left: 2px;
	}

	#streak-display {
		margin-right: var(--content-margin);
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: row;
		text-wrap: nowrap;
	}

	#end-screen-level-display {
		font-size: 14px;
		width: auto;
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
		min-width: fit-content;
		--content-shadow-color: color-mix(in hsl, #00cc00, black 20%);
	}

	.next-round-area {
		position: fixed;
		bottom: var(--box-margin);
		right: var(--box-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: calc(750px + var(--panel-margin) * 2);
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

	.distance-icon-animated :global(.distance-icon) {
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
			width: calc(720px + var(--box-margin));
		}
	}

	@media all and (max-width: 1350px) {
		.next-round-area {
			width: calc(100% - var(--box-margin) * 2);
			left: var(--box-margin);
		}

		#result-box {
			margin-bottom: 66px;
		}
	}
</style>
