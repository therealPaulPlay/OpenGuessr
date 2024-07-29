import { updateUsername } from "./userAPI";
import { playSound } from "./soundManager.js";
import { displayUserInfo, updatePinLocks } from "./accountLogic.js";
import { errorPopup } from "./errorHandling.js";
// This is used to dynamically load the profile view

//Profile Window ---------------------------------------------------------------------------------------------

export async function loadProfileFromId(id) {
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
          viewProfile(data.username, data.experience, false, data.profileData);
    
        } else {
          console.error('Failed to load profile:', response.status);
          errorPopup("Failed to load profile", "Couldn't load the user's profile.", response.status, false, false);
        }
      } catch (error) {
        console.error('Error occurred while fetching the user: ', error);
        errorPopup("Error occured while loading Profile", "Couldn't load the user's profile due to network error.", error, false, false);
      }
}

export function viewProfile(name, experience, yourProfile, profileData) {
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
    }
}

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", () => {
    closeProfile();
    playSound("basic_button");
});

export function closeProfile() {
    document.getElementById("profilePopup").style.display = "none";
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