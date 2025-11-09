<!-- previously known as the End Overlay, this screen shows the Result -->
<script>
	import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		resultScreenEnabled,
		distanceText,
		motivationText,
		continueText,
		earnedExperience,
		experienceBarAnimated,
		showStreakDisplay,
		streakText,
		supporterBoost,
		supporterBoostText,
		lastDistance,
	} from "$lib/stores/context-specific/resultScreenStore";
	import { openLocationOnMaps } from "$lib/utils/openLocationOnMaps";
	import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
	import { supporterLevel, isAuthenticated, experience } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { playSound } from "$lib/utils/soundManager";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
	import { transitionToStart } from "$lib/utils/transitionToStart";
	import { isElementClickable } from "$lib/utils/checkIfElementIsClickable";
	import { onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { get } from "svelte/store";
	import ResultScreenSlideup from "./ResultScreenSlideup.svelte";
	import ResultFullscreenMessage from "./ResultFullscreenCelebration.svelte";
	import { CircleUser, Flame, RulerDimensionLine } from "lucide-svelte";
	import { blur } from "svelte/transition";
	import { Confetti } from "svelte-confetti";

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

	experience.subscribe((value) => {
		level = getLevel();
		percentageWidth = Math.max(7, getLevelFraction() * 100) + "%"; // Minimum 7% to prevent weird thin line
	});

	// Trigger confetti
	$effect(() => {
		if ($resultScreenEnabled && $lastDistance < 500) showConfetti = true;
		else showConfetti = false;
	});
</script>

{#if $resultScreenEnabled}
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
					amount={100}
					delay={[delay, delay + 100]}
					colorRange={[0, 10]}
					duration={1500}
				/>
			{/each}
		</div>
	{/if}
	<div class="endBottomArea">
		<!-- Animations for great scores -->
		<ResultFullscreenMessage />

		<ResultScreenSlideup />
		<div class="endBottomBar">
			{#if $supporterLevel <= 1 && !$adsDisabled}
				<div class="floatingResultLeaderboardArea barMenu" transition:blur>
					<div id="floatingResultLeaderboardAd" class="floatingResultLeaderboardAd"></div>
					<RemoveAdsText text="Please consider supporting OpenGuessr to go ad-free." />
				</div>
			{/if}
			<div id="resultBox" class="barMenu">
				<div class="resultField" class:resultFieldHigh={$supporterLevel <= 1 && !$adsDisabled} id="motivationText">
					<p>{$motivationText}</p>
				</div>
				{#if $supporterLevel <= 1 && !$adsDisabled}
					<div id="mobileResultLeaderboardAdArea" class="resultField resultFieldHigh">
						<div id="mobileResultLeaderboardAd"></div>
						<RemoveAdsText text="Go Ad-Free." />
					</div>
				{/if}
				<div class="resultField">
					<RulerDimensionLine class="distance-icon" style="margin-right: 8px;" size={22} strokeWidth={2.25} />
					<p id="distanceText">{$distanceText}</p>
				</div>
				{#if $isAuthenticated}
					<div id="XParea" class="resultField">
						<div id="supporterBoost" bind:this={$supporterBoost}>
							<p id="supporterBoostText" bind:this={$supporterBoostText}>Supporter Boost (Default)</p>
						</div>
						<p id="endScreenLevelDisplay">Lvl. {level}</p>
						<div id="endScreenXPbar">
							<div
								class="XPbarResource"
								id="endScreenXPbarResource"
								class:XPbarAnimate={$experienceBarAnimated}
								style:width={percentageWidth}
							></div>
						</div>
						<p id="endScreenXP">{$animatedExperience.toFixed(0)} XP</p>
						{#if $showStreakDisplay}
							<div id="streakDisplay">
								<Flame style="margin-right: 5px;" size={22} strokeWidth={2.25} />
								<p id="endScreenStreakText">{$streakText}</p>
							</div>
						{/if}
					</div>
				{:else}
					<div id="XPbarNoAccount" class="resultField">
						<p id="signupPromptText">
							<CircleUser style="margin-bottom: -3px; margin-right: 3px;" strokeWidth={2.25} size={22} /> Sign up to see
							& save your score!
						</p>
					</div>
				{/if}
			</div>
		</div>
		<div class="barMenu nextRoundArea">
			<button
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					openLocationOnMaps(get(currentLocationLatitude), get(currentLocationLongitude));
				}}
			>
				<img src="/img/streetview_icon.png" alt="Streetview symbol" class="socialIcon" id="streetviewIcon" />
			</button>
			<button
				id="nextRound"
				class="standardButton white"
				style:pointer-events={$continueText.toLowerCase().includes("wait") ? "none" : ""}
				style:opacity={$continueText.toLowerCase().includes("wait") ? "0.5" : ""}
				onclick={() => {
					playSound("basic_button");
					transitionToStart();
				}}
			>
				<p class="nextRoundText">
					{$continueText}
				</p>
				<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="directionArrowIcon" />
			</button>
		</div>
	</div>
{/if}

<svelte:window
	onkeypress={(event) => {
		if (event.key === " " && isElementClickable(document.getElementById("nextRound")) && $resultScreenEnabled) {
			transitionToStart();
			playSound("basic_button");
		}
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
		align-items: center;
		color: white;
		width: 750px;
		flex-wrap: wrap;
		gap: var(--panel-margin);
		padding: var(--panel-margin);
		margin-inline: 10px;
	}

	.resultField {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.075);
		border-radius: 5px;
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		flex-grow: 10;
		position: relative;
		transition:
			width 250ms ease,
			height 250ms ease;
		overflow: hidden;
	}

	.resultFieldHigh {
		min-height: 40px;
	}

	.endBottomBar {
		display: flex;
		justify-content: center;
		align-items: center;
		height: fit-content;
		flex: 1;
		pointer-events: none;
		position: fixed;
		bottom: 10px;
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

	#mobileResultLeaderboardAdArea {
		min-width: 330px;
		height: 50px;
		max-height: 60px;
		padding: 5px;
		flex-grow: 1;
		position: relative;
	}

	#mobileResultLeaderboardAd {
		z-index: 1;
		overflow: hidden;
		text-align: center;
		width: 320px;
		height: 50px;
	}

	.floatingResultLeaderboardArea {
		width: 728px;
		height: 90px;
		display: none;
		justify-content: center;
		align-items: center;
		position: absolute;
		left: 50%;
		top: calc(-100px - var(--panel-margin));
		transform: translate(-50%, 0);
		padding: 5px;
		pointer-events: auto;
	}

	.floatingResultLeaderboardAd {
		z-index: 1;
		width: 728px;
		height: 90px;
		text-align: center;
	}

	#XParea {
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

	#endScreenXPbar {
		flex-grow: 10;
		height: 15px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 7px;
		transition: none;
	}

	#XPbarNoAccount {
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

	.XPbarResource {
		height: 100%;
		border-radius: 7px;
		background-color: #00cc00;
		width: 0%;
		transition: none;
		box-shadow: var(--bulb-shadow);
	}

	:global(.XPbarAnimate) {
		transition: width 1s ease;
		animation: XPFade 1s ease-in-out;
	}

	#endScreenXP {
		font-size: 22px;
		width: auto;
		vertical-align: middle;
		text-align: center;
		text-wrap: nowrap;
		flex-grow: 1;
		min-width: 115px;
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
		margin-left: 10px;
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
		padding-inline: 10px;
		margin-right: 5px;
		margin-left: 8px;
		color: white;
		background-color: #00cc00;
		box-shadow: var(--bulb-shadow);
		border-radius: 7px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nextRoundArea {
		z-index: 15;
		position: fixed;
		bottom: 10px;
		right: 10px;
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
		.floatingResultLeaderboardArea {
			display: flex;
		}

		#mobileResultLeaderboardAdArea {
			display: none;
		}

		.resultFieldHigh {
			min-height: unset;
		}

		#resultBox {
			width: 722px;
		}
	}

	@media all and (max-width: 1350px) {
		.nextRoundArea {
			width: calc(100% - 36px);
			left: 10px;
		}

		#resultBox {
			margin-bottom: 64px;
		}
	}
</style>
