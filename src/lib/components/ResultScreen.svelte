<!-- previously known as the End Overlay, this screen shows the Result -->
<script>
	import StreakRestore from "$lib/components/StreakRestore.svelte";
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

	const animatedExperience = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		animatedExperience.set($earnedExperience);
	});

	let level = $state(1);
	let percentageWidth = $state("0%");

	experience.subscribe((value) => {
		level = getLevel();
		percentageWidth = Math.max(7, getLevelFraction() * 100) + "%"; // Minimum 7% to prevent weird thin line
	});
</script>

<div id="endBottomArea" class:resultScreenHidden={!Boolean($resultScreenEnabled)}>
	<StreakRestore />
	<div id="endBottomBar">
		<div
			class="floatingResultLeaderboardArea"
			style:display={$supporterLevel >= 2 || !$resultScreenEnabled || $adsDisabled ? "none" : ""}
		>
			<div id="floatingResultLeaderboardAd" class="floatingResultLeaderboardAd"></div>
			<!-- id is necessary for ad script! -->
			<RemoveAdsText text="Please consider supporting OpenGuessr to go ad-free." learnMore="true" />
		</div>
		<div id="resultBox" class="barMenu">
			<div class="resultField resultFieldHigh" id="motivationText">
				<p>{$motivationText}</p>
			</div>
			<div
				id="mobileResultLeaderboardAdArea"
				class="resultField resultFieldHigh"
				style:display={$supporterLevel >= 2 || !$resultScreenEnabled || $adsDisabled ? "none" : ""}
			>
				<div id="mobileResultLeaderboardAd"></div>
				<RemoveAdsText text="Go Ad-Free." learnMore="true" />
			</div>
			<div class="resultField">
				<img src="/img/distance_icon.png" alt="Distance icon" id="distanceIcon" />
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
							<img id="streakIcon" src="/img/streak_icon.png" alt="country streak" />
							<p id="endScreenStreakText">{$streakText}</p>
						</div>
					{/if}
				</div>
			{:else}
				<div id="XPbarNoAccount" class="resultField">
					<p id="signupPromptText">See & save your earned points!</p>
					<button
						class="standardButton white continueButton smallSignupButton"
						onclick={() => {
							playSound("basic_button");
							signupPrompt();
						}}>Sign up</button
					>
				</div>
			{/if}
		</div>
	</div>
	<div id="nextRoundArea" class="barMenu">
		<button
			class="standardButton white continueButton"
			onclick={() => {
				playSound("basic_button");
				openLocationOnMaps(get(currentLocationLatitude), get(currentLocationLongitude));
			}}
		>
			<img src="/img/streetview_icon.png" alt="Streetview symbol" class="socialIcon" id="streetviewIcon" />
		</button>
		<button
			id="nextRound"
			class="standardButton white continueButton"
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
			<img id="nextRoundArrow" src="/img/arrow_icon.png" alt="Expand or close arrow" class="directionArrowIcon" />
		</button>
	</div>
</div>

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

	.resultScreenHidden {
		pointer-events: none !important;
		opacity: 0 !important;
	}

	.resultScreenHidden * {
		pointer-events: none !important;
	}

	#streetviewIcon {
		vertical-align: -2px;
	}

	.smallSignupButton {
		margin: 0;
		line-height: 5px;
		max-height: 35px !important;
		min-height: 35px !important;
		margin-top: -4px;
		margin-bottom: -4px;
		margin-right: -4px;
	}

	#nextRound {
		padding-inline: 25px;
		flex-grow: 1;
	}

	#resultBox {
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		max-width: 750px;
		flex-wrap: wrap;
		gap: 10px;
		padding: 8px;
		margin-inline: 10px;
	}

	.resultField {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.075);
		border-radius: 5px;
		padding: 10px;
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

	#distanceIcon {
		width: 25px;
		height: 25px;
		margin-bottom: -3px;
		margin-right: 10px;
	}

	#endBottomBar {
		display: flex;
		justify-content: center;
		align-items: center;
		height: fit-content;
		flex: 1;
		pointer-events: auto;
		position: fixed;
		bottom: 10px;
		left: 0;
		right: 0;
	}

	#endBottomArea {
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
		transition: opacity 250ms ease-out;
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
		border-radius: 10px;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		position: absolute;
		top: -110px;
		left: 50%;
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

	#supporterBoost p {
		color: white;
		font-size: 25px;
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
		background-color: #ccc;
		border-radius: 7px;
		transition: none;
	}

	#XPbarNoAccount {
		justify-content: space-between;
		max-height: 30px;
	}

	#signupPromptText {
		padding-inline: 10px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.XPbarResource {
		height: 100%;
		border-radius: 7px;
		background-color: #00cc00;
		width: 0%;
		transition: none;
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
		margin-left: 3px;
		text-wrap: nowrap;
	}

	#streakIcon {
		width: 25px;
		height: 25px;
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
		border-radius: 7px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	#nextRoundArea {
		z-index: 15;
		position: fixed;
		bottom: 10px;
		right: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5px;
		max-width: 750px;
		margin-inline: auto;
	}

	.nextRoundText {
		display: inline;
	}

	.continueButton {
		min-height: 42px;
		background-color: var(--panel-button-color);
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
			width: 720px;
		}
	}

	@media all and (max-width: 1350px) {
		#nextRoundArea {
			width: calc(100% - 32px);
			left: 10px;
		}

		#resultBox {
			margin-bottom: 65px;
		}
	}
</style>
