import { updateUsername } from "./userAPI";
import { playSound } from "./soundManager.js";
import { displayUserInfo, isAuthenticated, updatePinLocks } from "./accountLogic.js";
import { errorPopup } from "./errorHandling.js";
// This is used to dynamically load the profile view

//Profile Window ---------------------------------------------------------------------------------------------

let lastProfileOwnerYou = false;
let yourLoadedProfileData = "none";

export async function loadProfileFromId(id, you, view) {
    openClearedProfile();

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
            }

            // load data only or show profile
            if (view) {
                viewProfile(data.username, data.experience, data.joinedDate, you, data.profileData);
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
    document.getElementById("usernameInput").style.visibility = "hidden";
    document.getElementById("confirmUsername").style.visibility = "hidden";
    document.getElementById("usernameInput").style.display = "none";
    document.getElementById("confirmUsername").style.display = "none";
    document.getElementById("usernameInput").value = "";
    document.getElementById("profilePinHeader").style.display = "none";
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
}

function viewProfile(name, experience, joined, yourProfile, profileData) {
    lastProfileOwnerYou = yourProfile; // only update database entry on close if it was your profile that was opened
    document.getElementById("profileViewName").textContent = name ? name : "Guest";

    try {
        if (profileData && profileData.about) {
            document.getElementById("profileAbout").value = profileData.about;
            document.getElementById("profileAbout").style.display = "block";
            document.getElementById("profileAboutHeader").style.display = "block";
            if (!yourProfile) {
                document.getElementById("profileAbout").style.height = "1px";
                document.getElementById("profileAbout").style.height = (document.getElementById("profileAbout").scrollHeight - 25) + "px";
            }
        }

        if (profileData && profileData.duelsPlayed) {
            document.getElementById("statisticDuelsPlayed").textContent = profileData.duelsPlayed;
        }


        if (profileData && profileData.duelsWon) {
            document.getElementById("statisticDuelsWon").textContent = profileData.duelsWon;
        }

        if (profileData && profileData.competitionsPlayed) {
            document.getElementById("statisticCompetitionsEntered").textContent = profileData.competitionsPlayed;
        }

    } catch (e) {
        console.error("Error loading data from profileData in viewProfile: " + e);
    }

    // calculate the level
    document.getElementById("levelText").textContent = "Lvl. " + getExpStats(experience).level;

    // load statistics
    document.getElementById("statisticExperience").innerHTML = Number(experience).toLocaleString();
    document.getElementById("statisticUpgradeExperience").innerHTML = getExpStats(experience).requiredForLevelUpgrade.toLocaleString();
    document.getElementById("statisticJoinedDate").textContent = formatDateTime(joined);

    if (yourProfile) {
        updatePinLocks(localStorage.getItem("experience"));
        document.getElementById("editUsername").style.display = "inline-block";
        document.getElementById("profilePinHeader").style.display = "block";
        document.getElementById("pinSelector").style.display = "flex";
        document.getElementById("accountManagementHeader").style.display = "block";
        document.getElementById("accountManagementArea").style.display = "flex";
        document.getElementById("usernameInput").style.display = "inline";
        document.getElementById("confirmUsername").style.display = "inline";
        document.getElementById("profileAbout").style.pointerEvents = "auto";
        document.getElementById("profileAbout").style.display = "block";
        document.getElementById("profileAboutHeader").style.display = "block";
    }
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

function toggleUsernameView() {
    if (document.getElementById("usernameInput").style.visibility == "hidden") {
        document.getElementById("usernameInput").style.visibility = "visible";
        document.getElementById("confirmUsername").style.visibility = "visible";
    }
    else {
        document.getElementById("usernameInput").style.visibility = "hidden";
        document.getElementById("confirmUsername").style.visibility = "hidden";
        document.getElementById("usernameInput").value = "";
    }
}

// Username Update -------------------------------------------------------------------------------------------

document.getElementById("usernameInput").style.visibility = "hidden";
document.getElementById("confirmUsername").style.visibility = "hidden";

document.getElementById("editUsername").addEventListener("click", () => {
    toggleUsernameView();
    playSound("basic_button");
});
document.getElementById("confirmUsername").addEventListener("click", () => {
    updateProfileUsername();
    playSound("basic_button");
});

let newUsername;

async function updateProfileUsername() {
    newUsername = document.getElementById("usernameInput").value;
    toggleUsernameView();
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
function updateProfileData(aboutText, addDuelsPlayed, addDuelsWon, addCompetitionsPlayed) {
    aboutText = aboutText ? aboutText : yourLoadedProfileData.about;
    aboutText = aboutText ? aboutText : "";

    let duelsPlayed = yourLoadedProfileData.duelsPlayed;
    duelsPlayed = duelsPlayed ? duelsPlayed : 0;
    if (addDuelsPlayed) {
        duelsPlayed += addDuelsPlayed;
    }

    let duelsWon = yourLoadedProfileData.duelsWon;
    duelsWon = duelsWon ? duelsWon : 0;
    if (addDuelsWon) {
        duelsWon += addDuelsWon;
    }

    let competitionsPlayed = yourLoadedProfileData.competitionsPlayed;
    competitionsPlayed = competitionsPlayed ? competitionsPlayed : 0;
    if (addCompetitionsPlayed) {
        competitionsPlayed += addCompetitionsPlayed;
    }

    const profileData = {
        about: aboutText,
        duelsPlayed: duelsPlayed,
        duelsWon: duelsWon, 
        competitionsPlayed: competitionsPlayed
    }

    submitProfileData(profileData);
}

export async function addDuelPlayed() {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, 1);
    }
}

export async function addDuelWon() {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, null, 1);
    }
}

export async function addCompetitionPlayed() {
    // only load data - if it was successful, set statistics
    if (await loadProfileFromId(localStorage.getItem("id"), true, false)) {
        updateProfileData(null, null, null, 1);
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