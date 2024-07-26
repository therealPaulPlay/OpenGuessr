import { updateUsername } from "./userAPI";
import { playSound } from "./soundManager.js";
import { displayUserInfo, updatePinLocks } from "./accountLogic.js";
// This is used to dynamically load the profile view

//Profile Window ---------------------------------------------------------------------------------------------

let profileWindow = document.getElementById("profileWindow");

export function viewProfile(name, experience, userId, yourProfile) {
    profileWindow.style.display = "block";
    document.getElementById("editUsername").style.display = "none";
    document.getElementById("blackBackground").style.visibility = "visible";
    document.getElementById("profileViewName").textContent = name ? name : "Guest / Not loaded";

    // calculate the level
    document.getElementById("levelText").textContent = "Lvl. " + getExpStats(experience).level;

    // load statistics
    document.getElementById("statisticExperience").innerHTML = Number(localStorage.getItem("experience")).toLocaleString();
    document.getElementById("statisticUpgradeExperience").innerHTML = getExpStats(experience).requiredForLevelUpgrade.toLocaleString();

    if (yourProfile) {
        updatePinLocks(localStorage.getItem("experience"));
        document.getElementById("editUsername").style.display = "inline-block";
    }
}

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", () => {
    closeProfile();
    playSound("basic_button");
});

export function closeProfile() {
    profileWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
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
        await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then(() => {
            //updateUsername saves the new name in localstorage
            displayUserInfo();
            document.getElementById("profileViewName").textContent = newUsername;
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