import { restoreOldStreak } from "./accountLogic";
import { errorPopup } from "./errorHandling";
import { playSound } from "./soundManager";

//Streak Ad UI ----------------------------------------------------------------------------------------------------------------------------------

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
    initializeRewardAd();
    playSound("basic_button");
}


//Rewarded video Ad code -------------------------------------------------------------------------------------------------------------------------------------
//once everything is loaded, load the google tag
window.onload = () => {
    setTimeout(() => {
        try {
            googletag = window.googletag || { cmd: [] };
        } catch (error) {
            console.error("Google tag cannot be assigned: " + error);
        }
    }, 250);
  };

let rewardClaimed = false;
var rewardedSlot;
var adLoadTimeout;

function initializeRewardAd() {
    // Set a timeout to handle the scenario where no ad is returned in 10 seconds.
    adLoadTimeout = setTimeout(handleNoAdReturned, 10000);
    rewardClaimed = false;

    function handleNoAdReturned() {
        dismissRewardedAd(true);
        // Here you can also add any other cleanup or error handling code if required.
    }

    try {
        googletag.cmd.push(function () {
            rewardedSlot = googletag.defineOutOfPageSlot(
                // Venatus will supply separate line below as this is a demo tag
                // actual tag: /21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video
                // Test tag: /21726375739/ca-video-pub-5781531207509232-tag/Max_Rewarded_Video_Test'
                '/21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video',
                googletag.enums.OutOfPageFormat.REWARDED);

            if (rewardedSlot) {
                rewardedSlot.addService(googletag.pubads());

                googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
                    clearTimeout(adLoadTimeout);  // Clear the timeout when an ad is ready
                    event.makeRewardedVisible();
                });

                googletag.pubads().addEventListener('rewardedSlotClosed', () => {
                    setTimeout(() => {
                        dismissRewardedAd(false);
                    }, 350);
                });

                googletag.pubads().addEventListener('rewardedSlotGranted', function (event) {
                    rewardClaimed = true;
                    restoreStreak();
                });

                googletag.enableServices();
                googletag.display(rewardedSlot);
            }
        });
    } catch (error) {
        console.error("Error loading the rewarded ad: " + error);
    }
}

function dismissRewardedAd(notAvailable) {
    if (notAvailable) {
        errorPopup("No ad available. ", "Please try again later or disable Ad Blockers", "No ads");
        streakWatchAd.style.opacity = "1";
        streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
        streakAdDismiss.style.opacity = "1";
        streakAdDismiss.style.pointerEvents = "auto";
    } else {
        if (!rewardClaimed) {
            errorPopup("Ad dismissed", "Video ad dismissed. ", "Ad dismissed");
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

    try {
        googletag.destroySlots([rewardedSlot]);
    } catch (error) {
        console.error("Error destroying: " + error);
    }
}