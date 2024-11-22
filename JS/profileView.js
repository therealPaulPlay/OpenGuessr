import { updateUsername } from "./userAPI";
import { playSound } from "../src/lib/utils/soundManager.js";
import { isAuthenticated } from "./accountLogic.js";
import { errorPopup } from "./errorHandling.js";
import { showConfirmPopup } from "../src/lib/utils/confirmPopup.js";
import { get } from "svelte/store";
import { experience, supportedAmount, supporterLevel } from "../src/lib/stores/accountStore.js";
import { selectedPinIndex, selectedBadge } from "$lib/stores/accountStore.js";

// Badge system ----------------------------------------------------------------------------------------------------------------------------------------------------

const badgeButton = document.getElementById("badgeButton");

badgeButton.addEventListener("click", () => {
    openBadeWindow();
    playSound("basic_button");
});

document.getElementById("badgeArea").addEventListener("click", () => {
    openBadeWindow();
    playSound("basic_button");
});

document.getElementById("badgeClose").addEventListener("click", () => {
    playSound("basic_button");
    closeBadgeWindow();
});

function openBadeWindow() {
    updateBadgelocks();
    document.getElementById("badgePopup").style.display = "flex";
    // has to be after the display setting
    document.getElementById("badgeContainer").scrollTop = "0";
    document.getElementById("badgeWindow").scrollTop = "0";
}

function closeBadgeWindow() {
    document.getElementById("badgePopup").style.display = "none";
}

document.querySelectorAll(".badge").forEach((element) => {
    element.addEventListener("click", () => {
        selectBadge(element.id);
        playSound("item_select");
    });
});

function selectBadge(id) {
    try {
        document.querySelectorAll(".badge").forEach((element) => {
            element.classList.remove("badgeSelected");
        });
        document.getElementById(id).classList.add("badgeSelected");
        setProfileBadge(id);
        saveProfileBadge(id);
    } catch (error) {
        console.error("Error selecting badge: " + error);
    }
}

function setProfileBadge(id) {
    const badgeArea = document.getElementById("badgeArea");
    badgeArea.innerHTML = "";

    try {
        const badgeToClone = document.getElementById(id);
        if (badgeToClone) {
            const newBadge = badgeToClone.cloneNode(true);
            newBadge.classList.remove("badgeSelected");
            newBadge.classList.remove("badgeLocked");
            newBadge.id = "currentProfileBadgeSelection"; // change id to prevent overlap 
            badgeArea.appendChild(newBadge);
            document.getElementById("badgeButton").style.display = "none";
        }
    } catch (error) {
        console.error("Error setting profile badge: " + error);
    }
}

function updateBadgelocks() {
    try {
        document.querySelectorAll(".badge").forEach((e) => {
            if (e.id != "currentProfileBadgeSelection" && !e.id.includes("multiplayer")) {
                e.classList.add("badgeLocked");
            }
        });

        const statusPrefix = "Unlock next at ";

        const experienceStatus = document.getElementById("experienceBadgeStatus");
        const duelsStatus = document.getElementById("duelsBadgeStatus");
        const competitionsStatus = document.getElementById("competitionsBadgeStatus");
        const streaksStatus = document.getElementById("streakBadgeStatus");
        const supporterStatus = document.getElementById("supporterBadgeStatus");

        const experienceRequirements = [50000, 250000, 1000000, 10000000];
        const duelsRequirements = [5, 50, 100, 500];
        const competitionRequirements = [10, 50, 100, 500];
        const streaksRequirements = [5, 15, 50, 100];
        const supporterRequirements = [1, 2, 3, 4]; // supporter tiers

        let expIndex = 0;

        for (const amount of experienceRequirements) {
            expIndex++;

            experienceStatus.textContent = statusPrefix + amount.toLocaleString() + " XP";
            if (amount <= localStorage.getItem("experience")) {
                document.getElementById("expBadge" + expIndex).classList.remove("badgeLocked");
                if (expIndex == 4) {
                    experienceStatus.textContent = "All unlocked";
                }
            } else {
                break;
            }
        };

        let duelsIndex = 0;
        let duelsWins = 0;

        if (yourLoadedProfileData && yourLoadedProfileData.duelsWon) {
            duelsWins = yourLoadedProfileData.duelsWon;
        }

        for (const amount of duelsRequirements) {
            duelsIndex++;

            duelsStatus.textContent = statusPrefix + amount.toLocaleString() + " Wins";
            if (amount <= duelsWins) {
                document.getElementById("duelBadge" + duelsIndex).classList.remove("badgeLocked");
                if (duelsIndex == 4) {
                    duelsStatus.textContent = "All unlocked";
                }
            } else {
                break;
            }
        };

        let competitionsIndex = 0;
        let competitionEntries = 0;

        if (yourLoadedProfileData && yourLoadedProfileData.competitionsPlayed) {
            competitionEntries = yourLoadedProfileData.competitionsPlayed;
        }

        for (const amount of competitionRequirements) {
            competitionsIndex++;

            competitionsStatus.textContent = statusPrefix + amount.toLocaleString() + " Entries";
            if (amount <= competitionEntries) {
                document.getElementById("compBadge" + competitionsIndex).classList.remove("badgeLocked");
                if (competitionsIndex == 4) {
                    competitionsStatus.textContent = "All unlocked";
                }
            } else {
                break;
            }
        };

        let streaksIndex = 0;
        let highestStreak = 0;

        if (yourLoadedProfileData && yourLoadedProfileData.highestStreak) {
            highestStreak = yourLoadedProfileData.highestStreak;
        }

        for (const amount of streaksRequirements) {
            streaksIndex++;

            streaksStatus.textContent = statusPrefix + amount.toLocaleString() + " ended Streak";
            if (amount <= highestStreak) {
                document.getElementById("streakBadge" + streaksIndex).classList.remove("badgeLocked");
                if (streaksIndex == 4) {
                    streaksStatus.textContent = "All unlocked";
                }
            } else {
                break;
            }
        };

        let supporterIndex = 0;

        for (const amount of supporterRequirements) {
            supporterIndex++;

            supporterStatus.textContent = statusPrefix + "Tier " + amount.toLocaleString() + " Supporter";
            if (amount <= get(supporterLevel)) {
                document.getElementById("supporterBadge" + supporterIndex).classList.remove("badgeLocked");
                if (supporterIndex == 4) {
                    streaksStatus.textContent = "All unlocked";
                }
            } else {
                break;
            }
        };

        if (localStorage.getItem("id") <= 2) {
            document.getElementById("miscBadge1").classList.remove("badgeLocked");
        }
    } catch (error) {
        console.error("Error in updatePinLocks: " + error);
    }
}