<script>
	import { restoreOldStreak } from "$lib/logic/resultScoreLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { playSound } from "$lib/utils/soundManager";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
	import { initializeRewardedAd } from "$lib/utils/rewardedAds";
	import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";

	let streakHeaderText = $state("Streak lost! (Default)");
	let streakHeaderColor = $state("white");

	let streakText = $state("Default");
	let streakWatchAd = $state();
	let streakBanner = $state(); // This is the entire Popup
	let streakAdDismissEnabled = $state(true);
	let formerStreak = 0;

	function restoreStreak() {
		streakWatchAd.style.opacity = "0.5";
		streakWatchAd.style.pointerEvents = "none";
		streakAdDismissEnabled = true;
		streakText = `<p>You have restored your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span> !</p>`;
		streakHeaderText = "Streak restored!";
		restoreOldStreak(formerStreak); // This is in accountLogic.js
	}

	export function toggleStreakWindow(oldStreak, alwaysHide) {
		if (typeof oldStreak == "number" && oldStreak != 0) {
			formerStreak = oldStreak;
		}

		if (streakBanner.style.display == "block" || alwaysHide) {
			streakBanner.style.maxHeight = "0px";
			setTimeout(() => {
				streakBanner.style.display = "none";
				resetStreakWindow();
			}, 250);
		} else {
			if (!$adsDisabled) {
				streakBanner.style.display = "block";
				setTimeout(() => {
					streakBanner.style.maxHeight = "1000px";
					resetStreakWindow();
				}, 20);
			}
		}
	}

	// Assign function to store variable, to access it everywhere
	toggleStreakRestoreWindow.set(toggleStreakWindow);

	function resetStreakWindow() {
		streakWatchAd.style.opacity = "1";
		streakWatchAd.style.pointerEvents = "auto";
		streakAdDismissEnabled = true;
		streakHeaderText = "Streak lost!";
		streakText = `<p>Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span>!</p>`;
	}

	function showStreakAd() {
		streakWatchAd.style.opacity = "0.5";
		streakWatchAd.style.pointerEvents = "none";
		streakAdDismissEnabled = false;
		initializeRewardedAd(streakDismissRewardedAd, restoreStreak);
		playSound("basic_button");
	}

	function streakDismissRewardedAd(notAvailable, rewardClaimed) {
		if (notAvailable) {
			errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
			streakWatchAd.style.opacity = "1";
			streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
			streakAdDismissEnabled = true;
		} else {
			if (!rewardClaimed) {
				errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
				streakWatchAd.style.opacity = "1";
				streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
				streakAdDismissEnabled = true;
			} else {
				streakHeaderColor = "#00cf22";

				setTimeout(() => {
					streakHeaderColor = "white";
				}, 700);
			}
		}
	}
</script>

<div id="endScreenStreakRevive" class="barMenu" bind:this={streakBanner}>
	<div class="textBox">
		<h3 id="streakHeader" style:color={streakHeaderColor}>{streakHeaderText}</h3>
		<p id="keepStreakText" bind:innerHTML={streakText} contenteditable="false">
			Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="experienceHighlight"
				>0</span
			>
			!
		</p>
	</div>
	<div class="buttonBox">
		<button
			class="standardButton white streakAdDismiss {streakAdDismissEnabled ? '' : 'disabled'}"
			onclick={() => {
				playSound("basic_button");
				toggleStreakWindow(0, false);
			}}>Close</button
		>
		<button id="streakWatchAd" class="streakButton standardButton" onclick={showStreakAd} bind:this={streakWatchAd}>
			Keep streak
			<img src="/img/streak_icon.png" class="socialIcon streakIcon" alt="Streak Icon" />
		</button>
	</div>
</div>

<style>
	#endScreenStreakRevive {
		z-index: 16;
		padding: 8px;
		border-radius: 10px;
		max-height: 1000px;
		transition:
			filter 250ms ease,
			max-height 250ms ease;
		user-select: none;
		overflow: hidden;
		display: none; /* changed in code together with max-height */
		pointer-events: auto;
		position: fixed;
		bottom: 10px;
		left: 10px;
	}

	.textBox {
		padding: 10px;
		padding-inline: 12px;
		border-radius: 8px;
		background-color: var(--box-color);
	}

	.buttonBox {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: 20px;
		gap: 8px;
	}

	.streakIcon {
		vertical-align: -4px !important;
	}

	.streakAdDismiss.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.streakButton {
		background-color: #01a001;
	}

	#keepStreakText {
		width: 300px;
	}

	#streakHeader {
		transition: color 350ms ease;
		margin-bottom: 5px;
		font-size: 25px;
	}

	@media (max-width: 500px) {
		#endScreenStreakRevive {
			width: calc(100% - 36px);
		}
	}
</style>
