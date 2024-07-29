import { updateUsername } from "./userAPI";
import { playSound } from "./soundManager.js";
import { displayUserInfo, isAuthenticated, updatePinLocks } from "./accountLogic.js";
import { errorPopup } from "./errorHandling.js";
// This is used to dynamically load the profile view

//Profile Window ---------------------------------------------------------------------------------------------

let lastProfileOwnerYou = false;
let yourLoadedProfileData = "none";

export async function loadProfileFromId(id, you) {
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

            viewProfile(data.username, data.experience, you, data.profileData);

        } else {
            console.error('Failed to load profile:', response.status);
            errorPopup("Failed to load profile", "Couldn't load the user's profile.", response.status, false, false);
        }
    } catch (error) {
        console.error('Error occurred while fetching the user: ', error);
        errorPopup("Error occured while loading Profile", "Couldn't load the user's profile due to network error.", error, false, false);
    }
}

function viewProfile(name, experience, yourProfile, profileData) {
    lastProfileOwnerYou = yourProfile; // only update database entry on close if it was your profile that was opened

    document.getElementById("profilePopup").style.display = "flex";
    document.getElementById("profileViewName").textContent = name ? name : "Guest / Not loaded";

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

    try {
        if (profileData && profileData.about) {
            document.getElementById("profileAbout").value = profileData.about;
            document.getElementById("profileAbout").style.display = "block";
            document.getElementById("profileAboutHeader").style.display = "block";
        }

    } catch (e) {
        console.error("Error loading data from profileData in viewProfile: " + e);
    }

    // calculate the level
    document.getElementById("levelText").textContent = "Lvl. " + getExpStats(experience).level;

    // load statistics
    document.getElementById("statisticExperience").innerHTML = Number(experience).toLocaleString();
    document.getElementById("statisticUpgradeExperience").innerHTML = getExpStats(experience).requiredForLevelUpgrade.toLocaleString();

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
        loadProfileFromId(profileFromLink);
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
function updateProfileData(aboutText) {
    const profileData = {
        about: aboutText
    }

    submitProfileData(profileData);
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