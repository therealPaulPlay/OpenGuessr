import { restoreOldStreak } from "./accountLogic";
import { errorPopup } from "./errorHandling";
import { playSound } from "../src/lib/utils/soundManager";
import { initializeRewardAd } from "../src/lib/utils/rewardedAds";

let streakBanner = document.getElementById("endScreenStreakRevive");
let streakWatchAd = document.getElementById("streakWatchAd");
let streakText = document.getElementById("keepStreakText");
let streakAdDismiss = document.getElementById("streakAdDismiss");
let streakHeader = document.getElementById("streakHeader");
streakWatchAd.addEventListener("click", showStreakAd);

let formerStreak = 0;

streakAdDismiss.addEventListener("click", () => {
    playSound("basic_button");
    toggleStreakWindow(0, false);
});

function restoreStreak() {
    streakWatchAd.style.opacity = "0.5";
    streakWatchAd.style.pointerEvents = "none";
    streakAdDismiss.style.opacity = "1";
    streakAdDismiss.style.pointerEvents = "auto";
    streakText.innerHTML = `<p>You have restored your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span> !</p>`;
    streakHeader.textContent = "Streak restored!";
    // restore the old streak
    restoreOldStreak(formerStreak); //this is in accountLogic.js
}

export function toggleStreakWindow(oldStreak, alwaysHide) {
    if (typeof (oldStreak) == "number" && oldStreak != 0) {
        formerStreak = oldStreak;
    }

    if (streakBanner.style.display == "block" || alwaysHide) {
        streakBanner.style.maxHeight = "0px";
        setTimeout(() => {
            streakBanner.style.display = "none";
            resetStreakWindow();
        }, 250);
    } else {
        streakBanner.style.display = "block";
        setTimeout(() => {
            streakBanner.style.maxHeight = "1000px";
            resetStreakWindow();
        }, 20);
    }
}

function resetStreakWindow() {
    streakWatchAd.style.opacity = "1";
    streakWatchAd.style.pointerEvents = "auto";
    streakAdDismiss.style.opacity = "1";
    streakAdDismiss.style.pointerEvents = "auto";
    streakHeader.textContent = "Streak lost!"
    streakText.innerHTML = `<p>Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span> !</p>`;
}

function showStreakAd() {
    streakWatchAd.style.opacity = "0.5";
    streakWatchAd.style.pointerEvents = "none";
    streakAdDismiss.style.opacity = "0.5";
    streakAdDismiss.style.pointerEvents = "none";
    initializeRewardAd(streakDismissRewardedAd, restoreStreak);
    playSound("basic_button");
}

function streakDismissRewardedAd(notAvailable, rewardClaimed) {
    if (notAvailable) {
        errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
        streakWatchAd.style.opacity = "1";
        streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
        streakAdDismiss.style.opacity = "1";
        streakAdDismiss.style.pointerEvents = "auto";
    } else {
        if (!rewardClaimed) {
            errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
            streakWatchAd.style.opacity = "1";
            streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
            streakAdDismiss.style.opacity = "1";
            streakAdDismiss.style.pointerEvents = "auto";
        } else {
            streakHeader.style.color = "#00cf22";

            setTimeout(() => {
                streakHeader.style.color = "white";
            }, 700);
        }
    }
}