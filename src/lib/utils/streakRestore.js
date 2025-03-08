
import { restoreOldStreak } from "$lib/logic/resultScoreLogic";
import { errorPopup } from "$lib/utils/errorHandling";
import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
import { initializeRewardedAd } from "$lib/utils/rewardedAds";
import { showSlideup, slideupButtonDisabled, slideupButtonText, slideupCallback, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";

let formerStreak = 0;

function restoreStreak() {
	slideupButtonDisabled.set(true);
	slideupText.set(`<p>You have restored your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span>!</p>`);
	slideupTitle.set("Streak restored!")
	restoreOldStreak(formerStreak); // This is in accountLogic.js
}

export function toggleStreakWindow(oldStreak, alwaysHide) {
	if (typeof oldStreak == "number" && oldStreak != 0) {
		formerStreak = oldStreak;
	}
	if (!alwaysHide && !get(showSlideup)) setStreakWindowText();
	showSlideup.set(!get(showSlideup));
	if (alwaysHide) showSlideup.set(false);
}

function setStreakWindowText() {
	slideupButtonDisabled.set(false);
	slideupButtonText.set("Restore");
	slideupTitle.set("Streak lost!");
	slideupCallback.set(showStreakAd);
	slideupText.set(`<p>Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span>!</p>`);
}

function showStreakAd() {
	slideupButtonDisabled.set(true);
	initializeRewardedAd(streakDismissRewardedAd, restoreStreak);
}

function streakDismissRewardedAd(notAvailable, rewardClaimed) {
	if (notAvailable) {
		errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
		slideupButtonDisabled.set(false);
	} else {
		if (!rewardClaimed) {
			errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
			slideupButtonDisabled.set(false);
		}
	}
}
