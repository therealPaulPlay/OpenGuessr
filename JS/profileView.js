import { updateUsername } from "./userAPI";
import { playSound } from "./soundManager.js";
import { displayUserInfo, isAuthenticated } from "./accountLogic.js";
import { errorPopup } from "./errorHandling.js";
import { setSupporterPitch, showConfirmPopup } from "./mainUI.js";
// This is used to dynamically load the profile view

//Profile Window ---------------------------------------------------------------------------------------------

let lastProfileOwnerYou = false;
export let yourLoadedProfileData = "none";

export function updateLoadedProfileData(newData) {
    yourLoadedProfileData = newData;
}

export let supporterLevel = 0;

export function setSupporterLevel(newSupporterLevel) {
    supporterLevel = newSupporterLevel;
}

export async function loadProfileFromId(id, you, view) {
    if (view) {
        openClearedProfile(); // open clear profile as loading
    }

    try {
        const response = await fetch(`https://accounts.openguessr.com/accounts/profile/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();

            if (you && data.profileData) {
                yourLoadedProfileData = data.profileData;
                supporterLevel = data.supporterLevel || 0;
            }

            // load data only or show profile
            if (view) {
                viewProfile(data.username, data.experience, data.joinedDate, you, data.profileData, data.supporterLevel);
            }

            return true;

        } else {
            console.error('Failed to load profile:', response.status);
            errorPopup("Failed to load profile", "Couldn't load the user's profile.", response.status, false, false);
            return false;
        }
    } catch (error) {
        console.error('Error occurred while fetching the user: ', error);
        errorPopup("Error occured while loading Profile", "Couldn't load the user's profile due to network error.", error, false, false);
        return false;
    }
}

function openClearedProfile() {
    lastProfileOwnerYou = false;
    document.getElementById("profilePopup").style.display = "flex";
    document.getElementById("profileViewName").textContent = "Loading...";
    document.getElementById("editUsername").style.display = "none";
    document.getElementById("pinSelector").style.display = "none";
    document.getElementById("accountManagementHeader").style.display = "none";
    document.getElementById("accountManagementArea").style.display = "none";
    document.getElementById("profileScrollSection").scrollTop = "0";
    document.getElementById("profileAbout").style.pointerEvents = "none";
    document.getElementById("profileAbout").value = "";
    document.getElementById("profileAbout").style.display = "none";
    document.getElementById("profileAboutHeader").style.display = "none";
    document.getElementById("statisticDuelsPlayed").textContent = "0";
    document.getElementById("statisticDuelsWon").textContent = "0";
    document.getElementById("statisticCompetitionsEntered").textContent = "0";
    document.getElementById("profileAbout").style.height = "65px";
    document.getElementById("statisticExperience").innerHTML = "0";
    document.getElementById("statisticUpgradeExperience").innerHTML = "0";
    document.getElementById("statisticJoinedDate").textContent = "loading...";
    document.getElementById("statisticsLevelText").textContent = "0";
    document.getElementById("levelTextProfile").textContent = "Lvl. 0";
    document.getElementById("statisticHighestStreak").textContent = "0";
    document.getElementById("selectedProfilePin").src = "/IMG/your_marker0.png";
    document.getElementById("badgeButton").style.display = "none";
    document.getElementById("badgeArea").style.pointerEvents = "none";
    document.getElementById("badgeArea").innerHTML = "";
    document.getElementById("selectedProfilePin").style.pointerEvents = "none";
    document.getElementById("supporterTag").style.display = "none";
    document.getElementById("supporterArea").style.display = "none";
    setSupporterPitch();
}

function viewProfile(name, experience, joined, yourProfile, profileData, supporterLevel) {
    lastProfileOwnerYou = yourProfile; // only update database entry on close if it was your profile that was opened
    document.getElementById("profileViewName").textContent = name ? name : "Guest";

    if (yourProfile) {
        document.getElementById("editUsername").style.display = "inline-block";
        document.getElementById("pinSelector").style.display = "flex";
        document.getElementById("accountManagementHeader").style.display = "block";
        document.getElementById("accountManagementArea").style.display = "flex";
        document.getElementById("profileAbout").style.pointerEvents = "auto";
        document.getElementById("profileAbout").style.display = "block";
        document.getElementById("profileAboutHeader").style.display = "block";
        document.getElementById("badgeButton").style.display = "block";
        document.getElementById("badgeArea").style.pointerEvents = "auto";
        document.getElementById("selectedProfilePin").style.pointerEvents = "auto";
        document.getElementById("supporterArea").style.display = "flex";
    }

    try {
        if (profileData) {
            if (profileData.about) {
                document.getElementById("profileAbout").value = profileData.about;
                document.getElementById("profileAbout").style.display = "block";
                document.getElementById("profileAboutHeader").style.display = "block";
                if (!yourProfile) {
                    document.getElementById("profileAbout").style.height = "1px";
                    document.getElementById("profileAbout").style.height = (document.getElementById("profileAbout").scrollHeight - 25) + "px";
                }
            }

            if (profileData.duelsPlayed) {
                document.getElementById("statisticDuelsPlayed").textContent = profileData.duelsPlayed;
            }


            if (profileData.duelsWon) {
                document.getElementById("statisticDuelsWon").textContent = profileData.duelsWon;
            }

            if (profileData.competitionsPlayed) {
                document.getElementById("statisticCompetitionsEntered").textContent = profileData.competitionsPlayed;
            }

            if (profileData.highestStreak) {
                document.getElementById("statisticHighestStreak").textContent = profileData.highestStreak;
            }

            if (profileData.pin) {
                document.getElementById("selectedProfilePin").src = `/IMG/your_marker${profileData.pin}.png`;
            }

            if (profileData.badge) {
                if (yourProfile) {
                    selectBadge(profileData.badge);
                } else {
                    setProfileBadge(profileData.badge);
                }
            }
        }

        if (supporterLevel && supporterLevel > 0) {
            document.getElementById("supporterTag").style.display = "flex";
        }

    } catch (e) {
        console.error("Error loading data from profileData in viewProfile: " + e);
    }

    // calculate the level
    document.getElementById("statisticsLevelText").textContent = getExpStats(experience).level;
    document.getElementById("levelTextProfile").textContent = "Lvl. " + getExpStats(experience).level;

    // load statistics
    document.getElementById("statisticExperience").innerHTML = Number(experience).toLocaleString();
    document.getElementById("statisticUpgradeExperience").innerHTML = getExpStats(experience).requiredForLevelUpgrade.toLocaleString();
    document.getElementById("statisticJoinedDate").textContent = formatDateTime(joined);
}

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", () => {
    closeProfile();
    playSound("basic_button");
});

export function closeProfile() {
    document.getElementById("profilePopup").style.display = "none";

    if (lastProfileOwnerYou && isAuthenticated) {
        updateProfileData(document.getElementById("profileAbout").value);
    }
}

// Username Update -------------------------------------------------------------------------------------------

document.getElementById("editUsername").addEventListener("click", () => {
    showConfirmPopup("Update username", "Input your new name into the box and click confirm.", updateProfileUsername, false, true);
    playSound("basic_button");
});

let newUsername;

async function updateProfileUsername() {
    newUsername = document.getElementById("usernameInput").value;
    if (newUsername != "") {
        await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then((isOk) => {
            if (isOk) {
                // updateUsername saves the new name in localstorage
                displayUserInfo();
                document.getElementById("profileViewName").textContent = newUsername;
            }
        });
    }
}

// Exp and Level Calculation ------------------------------------------------------------------------------------------------------------

function getExpStats(xp) {
    try {

        const baseXP = 5000;
        const xpIncreaseRate = 1.1; // xp needed to level up increases per level

        // Calculate the level based on an exponential growth of required XP
        let templevel = 1;
        let requiredXP = baseXP;

        while (xp >= requiredXP) {
            xp -= requiredXP;
            templevel++;
            requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
        }

        return { fraction: (xp / requiredXP), requiredForLevelUpgrade: requiredXP - xp, level: templevel };
    } catch (error) {
        console.error("Error calculating Experience related values in profileView.js: " + error);
        return null;
    }
}

// Open profile from link ---------------------------------------------------------------------------------------------------------------

let urlParams = new URLSearchParams(window.location.search);

let profileFromLink;

try {
    profileFromLink = urlParams.get("profile");
    if (profileFromLink) {
        loadProfileFromId(profileFromLink, false, true);
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
} catch { }

// About input line limit --------------------------------------------------------------------------------------------------------------

const textarea = document.getElementById("profileAbout");
const maxLines = 2;

textarea.addEventListener('input', () => {
    const lines = textarea.value.split('\n');
    if (lines.length > maxLines) {
        textarea.value = lines.slice(0, maxLines).join('\n');
    }
});

// Submit profile data ----------------------------------------------------------------------------------------------------------------

// always construct new object to prevent bad overlaps or issues
function updateProfileData(newAboutText, addDuelsPlayed, addDuelsWon, addCompetitionsPlayed, setHighestStreak, newPin, newBadge) {
    try {
        // about text
        let aboutText;
        
        if (yourLoadedProfileData) {
            aboutText = yourLoadedProfileData.about ? yourLoadedProfileData.about : "";
        }

        if (newAboutText != undefined) {
            aboutText = newAboutText;
        }
        
        // duels played
        let duelsPlayed;

        if (yourLoadedProfileData) {
            duelsPlayed = yourLoadedProfileData.duelsPlayed;
        }

        duelsPlayed = duelsPlayed ? duelsPlayed : 0;
        
        if (addDuelsPlayed) {
            duelsPlayed += addDuelsPlayed;
        }
        
        // duels won
        let duelsWon;

        if (yourLoadedProfileData) {
            duelsWon = yourLoadedProfileData.duelsWon;
        }

        duelsWon = duelsWon ? duelsWon : 0;
        
        if (addDuelsWon) {
            duelsWon += addDuelsWon;
        }
        
        // competitions played
        let competitionsPlayed;

        if (yourLoadedProfileData) {
            competitionsPlayed = yourLoadedProfileData.competitionsPlayed;
        }   

        competitionsPlayed = competitionsPlayed ? competitionsPlayed : 0;
        
        if (addCompetitionsPlayed) {
            competitionsPlayed += addCompetitionsPlayed;
        }

        // streak
        let newStreak;
        
        if (yourLoadedProfileData) {
            newStreak = yourLoadedProfileData.highestStreak;
        }

        newStreak = newStreak ? newStreak : 0;

        if (setHighestStreak && newStreak < setHighestStreak) {
            newStreak = setHighestStreak;
        }

        // pin
        let pin;
        
        if (yourLoadedProfileData) {
            pin = yourLoadedProfileData.pin;
        }

        pin = pin ? pin : 0;

        if (newPin != undefined) {
            pin = newPin;
        }

        // badge
        let badge;

        if (yourLoadedProfileData) {
            badge = yourLoadedProfileData.badge;
        }

        badge = badge ? badge : null;

        if (newBadge) {
            badge = newBadge;
        }
    
        const profileData = {
            about: aboutText,
            duelsPlayed: duelsPlayed,
            duelsWon: duelsWon,
            competitionsPlayed: competitionsPlayed,
            highestStreak: newStreak,
            pin: pin,
            badge: badge
        }
    
        submitProfileData(profileData);
        yourLoadedProfileData = profileData; // also update the loaded profile data with these changes to make sure that changes always carry on to queried requests
    } catch (error) {
        console.error("Error in updateProfileData: " + error);
    }
}

export async function addDuelPlayed() {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, 1);
    }
}

export async function addDuelWon() { // also adds 1 to duel played
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, 1, 1);
    }
}

export async function addCompetitionPlayed() {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, null, null, 1);
    }
}

export async function setCheckNewHighestStreak(streak) {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        if (yourLoadedProfileData.highestStreak && yourLoadedProfileData.highestStreak < streak); // check if it is actually greater than old streak (this also checks in update function)
        updateProfileData(null, null, null, null, streak);
    }
}

export async function setSelectedProfilePin(pinId, updateUI) {
    // only load data - if it was successful, set statistics
    if (!yourLoadedProfileData.pin || yourLoadedProfileData.pin != pinId) {
        if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
            updateProfileData(null, null, null, null, null, pinId);
        }
        if (updateUI) {
            document.getElementById("selectedProfilePin").src = `/IMG/your_marker${pinId}.png`;
        }
    }
}

async function saveProfileBadge(badge) {
    // only load data - if it was successful, set statistics
    if (!yourLoadedProfileData.badge || yourLoadedProfileData.badge != badge) { // only execute if selection actually changed
        if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
            selectedBadge = badge;
            updateProfileData(null, null, null, null, null, null, badge);
        }
    }
}

async function submitProfileData(profileDataObject) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            profileData: JSON.stringify(profileDataObject)
        }

        // Make the PUT request using Fetch API
        const response = await fetch("https://accounts.openguessr.com/accounts/profile/update", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        // Check if the response is successful
        if (response.ok) {

        } else {
            console.error('Profile update failed: ', response.status);
            errorPopup("Profile update failed", "The server returned an error for the profile update.", response.status, false, false);
        }

    } catch (error) {
        console.error('Error occurred during profile update: ', error);
        errorPopup("Profile update failed", "The profile update failed due to a network error.", error, false, false);
    }
}

// Format database datetime -------------------------------------------------------------------------------------------------------

function formatDateTime(datetimeStr) {
    const now = new Date();
    const date = new Date(datetimeStr);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays <= 7) {
        return "A few days ago";
    } else if (diffWeeks === 1) {
        return "A week ago";
    } else if (diffWeeks <= 4) {
        return "A few weeks ago";
    } else if (diffMonths === 1) {
        return "A month ago";
    } else if (diffMonths <= 12) {
        return "A few months ago";
    } else if (diffYears === 1) {
        return "A year ago";
    } else {
        return diffYears + " years ago";
    }
}

// Pin selection --------------------------------------------------------------------------------------------------------------------------

export let selectedPinIndex = 0;

document.getElementById("selectedProfilePin").addEventListener("click", () => {
    playSound("basic_button");
    updatePinLocks(localStorage.getItem("experience"));
    loadSelectedPin();
    document.getElementById("pinPopup").style.display = "flex";
});

document.getElementById("pinClose").addEventListener("click", () => {
    playSound("basic_button");
    document.getElementById("pinPopup").style.display = "none";
});

// Function to load selected pin from localStorage
export function loadSelectedPin() {
    if (yourLoadedProfileData) {
        selectedPinIndex = yourLoadedProfileData.pin ? yourLoadedProfileData.pin : 0;
    } else {
        selectedPinIndex = 0;
    }

    selectPin(selectedPinIndex, false);
}

// Add click event listener to pinHolder buttons
document.querySelectorAll('.pinHolder').forEach(function (btn, index) {
    btn.addEventListener('click', function () {
        selectPin(index, true); // Call selectPin function on button click
    });
});

// Function to update pinLocks based on XP

const pinRequirements = [["experience", 0], ["experience", 5000], ["experience", 30000], ["experience", 100000], ["experience", 500000],
["experience", 5000000], ["experience", 10000000], ["duelWins", 75], ["competitionsPlayed", 50], ["highestStreak", 10], ["competitionsPlayed", 250], ["supporter", 1]];

function updatePinLocks() {

    const pinLocks = document.querySelectorAll('.pinLock');
    pinLocks.forEach(function (lock) {
        const lockIndex = Number(lock.id.replace("pinLock", ""));
        const lockRequirementType = pinRequirements[lockIndex][0];
        const lockRequirementAmount = pinRequirements[lockIndex][1];

        if (lockRequirementType == "experience") {
            if (localStorage.getItem("experience") >= lockRequirementAmount) {
                lock.style.display = "none"; // Hide pinLock if XP is enough
            } else {
                lock.style.display = "flex"; // Show pinLock if XP is not enough
            }
        }

        if (lockRequirementType == "duelWins") {
            if (yourLoadedProfileData.duelsWon >= lockRequirementAmount) {
                lock.style.display = "none";
            } else {
                lock.style.display = "flex";
            }
        }

        if (lockRequirementType == "competitionsPlayed") {
            if (yourLoadedProfileData.competitionsPlayed >= lockRequirementAmount) {
                lock.style.display = "none";
            } else {
                lock.style.display = "flex";
            }
        }

        if (lockRequirementType == "highestStreak") {
            if (yourLoadedProfileData.highestStreak >= lockRequirementAmount) {
                lock.style.display = "none"; 
            } else {
                lock.style.display = "flex";
            }
        }

        if (lockRequirementType == "supporter") {
            if (supporterLevel >= lockRequirementAmount) {
                lock.style.display = "none";
            } else {
                lock.style.display = "flex";
            }
        }
    });
}

// Function to handle pin selection
function selectPin(index, activeSelect) {
    // Check if the pinHolder and pinLock exist
    const pinHolders = document.querySelectorAll('.pinHolder');
    if (pinHolders.length > index) {
        const pinLock = pinHolders[index].querySelector('.pinLock');
        if ((pinLock && (pinLock.style.display === 'none' || pinLock.style.display === '')) || !activeSelect) {
            // Remove selectedPin class from all pinHolder buttons
            document.querySelectorAll('.pinHolder').forEach(function (btn) {
                btn.classList.remove('selectedPin');
            });

            // Add selectedPin class to the clicked pinHolder button
            pinHolders[index].classList.add('selectedPin');

            if (activeSelect) {
                playSound("item_select");
            }

            if (index != null || typeof (index) == "number") {
                // Set selectedPin index to localStorage
                selectedPinIndex = index;
                if (activeSelect) {
                    setSelectedProfilePin(index, true);
                }
            }

        } else {
            if (activeSelect) {
                playSound("pin_locked");
            }
        }
    }
}

// Badge system ----------------------------------------------------------------------------------------------------------------------------------------------------

export let selectedBadge = null;

export function loadSelectedBadge() {
    if (yourLoadedProfileData) {
        selectedBadge = yourLoadedProfileData.badge ? yourLoadedProfileData.badge : null;
    }
}

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
        const newBadge = badgeToClone.cloneNode(true);
        newBadge.classList.remove("badgeSelected");
        newBadge.classList.remove("badgeLocked");
        newBadge.id = "currentProfileBadgeSelection"; // change id to prevent overlap 
        badgeArea.appendChild(newBadge);
        document.getElementById("badgeButton").style.display = "none";
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
            if (amount <= supporterLevel) {
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

// Supporter Profile Area -----------------------------------------------------------------------------------------------------------

let supporterTag = document.getElementById("supporterTag")

let tagTimeout;

supporterTag.addEventListener("mouseover", () => {
    clearTimeout(tagTimeout);
    tagTimeout = setTimeout(() => {
        document.getElementById("supporterTagText").classList.remove("supporterTextHidden");
    }, 200);
});

supporterTag.addEventListener("mouseout", () => {
    clearTimeout(tagTimeout);
    document.getElementById("supporterTagText").classList.add("supporterTextHidden");
});