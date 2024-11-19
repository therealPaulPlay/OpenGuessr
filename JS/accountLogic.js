import { deleteUser, getUser } from "./userAPI";
import { checkTextLength, freeSupporterBoostEnabled, setAdVisibility, showPageBrowser, supporterXpBoostAnimation, toggleMobileMenu } from "./mainUI";
import { showConfirmPopup } from "../src/lib/utils/confirmPopup.js";
import { isHost, peerSendsHost, peerId, updatePeerDataScore, multiplayerCategory, highestMultiplayerSupporterLevel, attemptJoinViaLink } from "./multiplayer.js";
import { checkIfGuessWasCorrect } from "../src/lib/utils/countryGuesserFunctions.js";
import { playSound } from "../src/lib/utils/soundManager.js";
import { currentLocationLatitude, currentLocationLongitude } from "../src/lib/stores/locationStore.js";
import { getCountryFromCoords } from "../src/lib/utils/countryFromCoordinates.js";
import { diameter } from "../src/lib/logic/miniMap.js";
import { mapPinLat, mapPinLng } from "../src/lib/stores/context-specific/mapStore.js";
import { toggleStreakWindow } from "./streakAdPopup.js";
import { addResultToCompetitionScore, playingCompetition } from "../src/lib/logic/competitionLogic.js";
import { closeProfile, loadProfileFromId, setCheckNewHighestStreak, loadSelectedPin, updateLoadedProfileData, loadSelectedBadge, setSupporterLevel, supporterLevel } from "./profileView.js";
import { errorPopup } from "$lib/utils/errorHandling";
import { initializeWebsocketConnection, setInboxStatus } from "./friendMenu.js";
import { saveRoundToLog } from "./singleplayerOptions.js";
import { setUserXP } from "$lib/utils/setUserXP";
import { resultScreenEnabled } from "../src/lib/stores/context-specific/resultScreenStore.js";
import { animateIncrement } from "../src/lib/utils/animateIncrement.js";
import { isAuthenticated, experience } from "$lib/stores/accountStore";
import { isTokenExpired } from "../src/lib/utils/isTokenExpired.js";
import { multiplayer } from "../src/lib/stores/modeStore.js";
import { get } from "svelte/store";

let accountLockedArray;
let lastDistance;
let lastXPloadingAttemptAborted = false;

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", () => {
  playSound("basic_button");
  goTologin();
});

let mobileLoginButton = document.getElementById("mobileLoginButton");
mobileLoginButton.addEventListener("click", () => {
  playSound("basic_button");
  goTologin();
});

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

let mobileLogoutButton = document.getElementById("mobileLogoutButton");
mobileLogoutButton.addEventListener("click", signout);

let profileButton = document.getElementById("profileInfo");
profileButton.addEventListener("click", () => {
  loadProfileFromId(localStorage.getItem("id"), true, true);
  playSound("basic_button");
});

let mobileProfileButton = document.getElementById("mobileProfileButton");
mobileProfileButton.addEventListener("click", function () {
  playSound("basic_button");
  loadProfileFromId(localStorage.getItem("id"), true, true);
});

let displayAccountName = document.getElementById("accountName");

let XPbarNoAccount = document.getElementById("XPbarNoAccount");
let XParea = document.getElementById("XParea");

//default is not logged in, so these are all disabled
logoutButton.style.display = "none";
mobileLogoutButton.style.display = "none";
mobileProfileButton.style.display = "none";
XParea.style.display = "none";

let resultLevelText = document.getElementById("endScreenLevel");
let resultLevelDisplay = document.getElementById("endScreenLevelDisplay");

// Account Deletion ----------------------------------------------------------------------------------------------------------------

document.getElementById("accountDeleteButton").addEventListener("click", () => {
  playSound("basic_button");
  showConfirmPopup("Delete your account", "Please input your password to confirm the account deletion. Make sure to delete user-created content before proceeding, if you wish to remove that from the platform.", submitAccountDeletion, true);
});

async function submitAccountDeletion() {
  let successState = await deleteUser(localStorage.getItem("id"), document.getElementById("accountDeletePassword").value, "index");
  if (successState) {
    signout();

    setTimeout(() => {
      closeProfile();
      errorPopup("Account deleted successfully", "You have deleted your OpenGuessr account.", "", false, true);
    });
  }
}

// Custom signup -------------------------------------------------------------------------------------------------------------------

checkAuthenticationStatus();

// Global function that changes everything to logged in or signed out (all other sign-in functions are related to this)
export function checkAuthenticationStatus() {
  let bearerToken = localStorage.getItem("bearer");

  if (bearerToken != null && bearerToken != "") {
    if (isTokenExpired(bearerToken)) {
      isAuthenticated.set(false);
      resetLocalSave();
    }
    else {
      isAuthenticated.set(true);
    }
  }
  else {
    isAuthenticated.set(false);
  }
  checkSigninStatusAndLoadUserInfo(); //set UI accordingly
}

function resetLocalSave() {
  localStorage.removeItem("bearer");
  localStorage.removeItem("id");
  updateLoadedProfileData(null);
}

function signout() {
  resetLocalSave();
  checkAuthenticationStatus();
}

function goTologin() {
  showPageBrowser("/signup.html", true);
}

//Account UI (working) -------------------------------------------------------------------------------------------------------------

document.getElementById("resultSignupPrompt").addEventListener("click", function () {
  goTologin();
});

//part of checkSigninStatusAndLoadUserInfo
async function changeUItoSignedIn(supporterLevel) {
  logoutButton.style.display = "inline-block";
  loginButton.style.display = "none";
  mobileLogoutButton.style.display = "inline-block";
  mobileLoginButton.style.display = "none";
  mobileProfileButton.style.display = "inline-block";
  XPbarNoAccount.style.display = "none";
  XParea.style.display = "flex";
  enableExclusiveCategories();
  displayUserInfo();
  loadSelectedPin(); // loads it from fetched profile data
  loadSelectedBadge();

  if (supporterLevel && supporterLevel > 0) {
    updateSupporterProfileHighlight(true);
  }

  if (supporterLevel && supporterLevel >= 2) {
    setAdVisibility(false);
  }

  if (get(resultScreenEnabled) && lastXPloadingAttemptAborted) {
    loadResultScreenXP(lastDistance);
  }
}

async function changeUItoSignedOut() {
  logoutButton.style.display = "none";
  loginButton.style.display = "inline-block";
  mobileLogoutButton.style.display = "none";
  mobileLoginButton.style.display = "inline-block";
  mobileProfileButton.style.display = "none";
  XPbarNoAccount.style.display = ""; // resets to flex state
  XParea.style.display = "none";
  disableExlcusiveCategories();
  displayAccountName.innerHTML = "Guest";
  checkTextLength();
  uiSetUserXP(0);
  loadSelectedPin(); // loads pin 0, as profile data should be undefined
  loadSelectedBadge();
  updateSupporterProfileHighlight(false);
  setInboxStatus(false);
  setAdVisibility(true);
}

function updateSupporterProfileHighlight(highlight) {
  if (highlight) {
    document.getElementById("profileInfo").classList.add("profileInfoSupporter");
  } else {
    document.getElementById("profileInfo").classList.remove("profileInfoSupporter");
  }
}

// part of checkSigninStatusAndLoadUserInfo
export function displayUserInfo() {
  uiSetUserXP(get(experience));
  displayAccountName.innerHTML = localStorage.getItem("username");
  checkTextLength();
}

async function checkSigninStatusAndLoadUserInfo() {
  if (get(isAuthenticated)) {
    profileButton.classList.remove("notSignedIn");
    //load user data - experience, username etc. could have been changed on a different device -> make sure to load them in!
    try {
      await getUser(localStorage.getItem("bearer"), localStorage.getItem("id"), "index").then((user) => {
        updateLoadedProfileData(user.profile_data);
        changeUItoSignedIn(user.supporter_level); // display user info is already being called in here
        setSupporterLevel(user.supporter_level, user.supported_amount);
        if (user.new_requests) { setInboxStatus(true); }
        initializeWebsocketConnection();
      });
    } catch (error) {
      console.error("Error getting user data in checkSigninStatusAndLoadUserInfo: " + error);
    }
  }
  else {
    changeUItoSignedOut();
    profileButton.classList.add("notSignedIn");
  }

  // now, check for multiplayer joins
  attemptJoinViaLink();
}

function enableExclusiveCategories() {
  let accountLocked = document.getElementsByClassName("accountLock");
  accountLockedArray = Array.from(accountLocked); // Convert to array
  for (let i = 0; i < accountLockedArray.length; i++) {
    accountLockedArray[i].classList.remove("accountLock");
  }

  document.querySelectorAll(".mapsAccountLock").forEach((e => e.style.visibility = "hidden"));
}

function disableExlcusiveCategories() {
  if (accountLockedArray) {
    for (let i = 0; i < accountLockedArray.length; i++) {
      accountLockedArray[i].classList.add("accountLock");
    }
  }

  document.querySelectorAll(".mapsAccountLock").forEach(e => e.style.visibility = "visible");
}

// Account UI - set circular progress bar ----------------------------------------------------------------------------------

function setProgress(factor) {
  const circle = document.querySelector('.progressRingCircle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = `${circumference}`;

  const offset = circumference - (factor) * circumference;
  circle.style.strokeDashoffset = offset;
}

//XP bar loading function -------------------------------------------------------------------------------------------------
let requiredXP;

export function uiSetUserXP(xp) {
  if (xp == undefined || xp == null) {
    xp = 0;
  }

  const baseXP = 5000;
  const xpIncreaseRate = 1.1; // xp needed to level up increases per level

  // Calculate the level based on an exponential growth of required XP
  let templevel = 1;
  requiredXP = baseXP;

  while (xp >= requiredXP) {
    xp -= requiredXP;
    templevel++;
    requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
  }

  if (get(isAuthenticated)) {
    document.getElementById("progressRingLevel").innerHTML = templevel;
    resultLevelDisplay.innerHTML = "Lvl. " + templevel;

    // account UI level circle
    setProgress(xp != 0 ? Math.max((xp / requiredXP), 0.1) : 0);
  } else {
    setProgress(0);
    document.getElementById("progressRingLevel").innerHTML = "1";
  }

  return { fraction: (xp / requiredXP), requiredForLevelUpgrade: requiredXP - xp, level: templevel };
}

function willCauseLevelUpgrade(xp, newXP) {
  const baseXP = 5000;
  const xpIncreaseRate = 1.1;

  let templevel = 1;
  requiredXP = baseXP;

  while (xp >= requiredXP) {
    xp -= requiredXP;
    templevel++;
    requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
  }

  return ((xp + newXP) / requiredXP);
}

// Calculate XP gain for each round ---------------------------------------------------------------------------------------
let streak = 0;
let streakDisplay = document.getElementById("streakDisplay");
let streakText = document.getElementById("endScreenStreakText");

let tempLoadedStreak = localStorage.getItem("streak");
if (tempLoadedStreak != null) {
  streak = Number(tempLoadedStreak);
}

function calculateMultiplier(streak) {
  if (streak === 0) {
    return 1;
  } else if (streak >= 9) {
    return 1.5;
  } else {
    return Math.round((1 + (streak / 9) * 0.5) * 100) / 100;
  }
}

let streakMultiplier = 1;

export function restoreOldStreak(oldStreak) {
  streak = oldStreak;
  localStorage.setItem("streak", streak);
  streakMultiplier = calculateMultiplier(streak);
  streakText.textContent = streak + " (" + streakMultiplier + "x)";
}

async function streakCalculation() {
  if (!multiplayer && !playingCompetition) {
    if (await getCountryFromCoords(get(mapPinLat), get(mapPinLng)) == await getCountryFromCoords(get(currentLocationLatitude), get(currentLocationLongitude))) {
      streak++;
    } else {
      if (streak >= 2) {
        toggleStreakWindow(streak, false);
      }

      setCheckNewHighestStreak(streak); // checks if this was the highest streak yet and 

      streak = 0; //reset country streak ( = Streak lost, but still restorable wit ad)
    }

    localStorage.setItem("streak", streak);

    streakMultiplier = calculateMultiplier(streak);
    streakText.textContent = streak + " (" + streakMultiplier + "x)";

    streakDisplay.style.opacity = "1";
    streakDisplay.style.width = "auto";
    streakDisplay.style.maxWidth = "unset";
  }
}

function getStreakMultiplierAdjustedToGamemode() {
  if (!multiplayer && !playingCompetition) {
    return streakMultiplier;
  } else {
    return 1;
  }
}

// Adjust XP calculation parameter to diameter (country size)
function calculateExponentialModifier(mapDiameter) {
  const A = 0.9978;
  const B = 0.08;
  const C = 0.06;
  return A - B * Math.exp(-C * mapDiameter);
}


async function calculateXPGain(distance, category, supporterLevel, freeSupporterBoost) {
  let returnXP = 0;

  if (category == null || category == "standard" || category == "capital") {
    await streakCalculation();
    returnXP = Math.round((5000 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode());

  } else if (category == "famous" || category == "image") {
    await streakCalculation();
    returnXP = Math.round((1500 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // 1500 xp, with streak up to 1800sth

  } else if (category == "country") {
    returnXP = checkIfGuessWasCorrect() ? 1000 : 0;

  } else {

    if (diameter > 250) await streakCalculation(); // If the map is big enough, calculate the country streak
    returnXP = Math.round(5000 * ((calculateExponentialModifier(diameter)) ** distance));
  }

  let supporterMultiplier = 1;

  if (supporterLevel && supporterLevel > 0) {
    switch (supporterLevel) {
      case 1:
        supporterMultiplier = 1.1;
        break;
      case 2:
        supporterMultiplier = 1.15;
        break;
      case 3:
        supporterMultiplier = 1.2;
        break;
      case 4:
        supporterMultiplier = 1.25;
    }
  }

  if (freeSupporterBoost && supporterMultiplier < 1.2) {
    supporterMultiplier = 1.2;
  }

  return { earnedXP: Math.round(returnXP * supporterMultiplier), earnedXPWithoutSupporterBoost: returnXP, supporterMultiplier: supporterMultiplier };
}

let animateSupporterBoostTimeout;

export async function loadResultScreenXP(distance) {

  let supporterMultiplier = 1;
  clearTimeout(animateSupporterBoostTimeout);

  lastDistance = distance;

  if (!get(isAuthenticated) && !get(multiplayer)) {
    lastXPloadingAttemptAborted = true;
  }

  // Save played round to log ------------------------------------------------
  let mode = "Singleplayer";
  if (multiplayer) mode = "Multiplayer";
  if (playingCompetition) mode = "Competition";

  saveRoundToLog(mode, distance, [get(currentLocationLatitude), get(currentLocationLongitude)]);

  // If Authenticated or in Multiplayer, show XP thing ------------------------------
  if (get(isAuthenticated) || get(multiplayer)) {
    lastXPloadingAttemptAborted = false;

    // Checks whether or not the extra XP will cause the level to upgrade. Returns a value above 1 if yes. 
    let XPbarResource = document.getElementById("endScreenXPbarResource");

    let currentXP = Number(get(experience));

    if (currentXP == null) {
      currentXP = 0;
    }

    let selectedCategory = localStorage.getItem("selectedCategory");

    // Hide streak display
    streakDisplay.style.opacity = "0";
    streakDisplay.style.width = "0";
    streakDisplay.style.maxWidth = "0";

    let earnedXP;
    let earnedBasicXP; // without supporter mutliplier, that will be applied later (this is just for visuals)

    // XP calculation formulas -------------------------------------------------
    if (!multiplayer && !playingCompetition) {
      const calculatedXP = await calculateXPGain(distance, selectedCategory, supporterLevel, freeSupporterBoostEnabled);
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

    } else if (multiplayer) {
      //always use the standard formula for multiplayer 
      const calculatedXP = await calculateXPGain(distance, multiplayerCategory, highestMultiplayerSupporterLevel);
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

      if (isHost) {
        updatePeerDataScore(peerId, earnedXP);
      } else {
        peerSendsHost("score", earnedXP);
      }

    } else if (playingCompetition) {
      const calculatedXP = await calculateXPGain(distance, "standard"); // always use standard calculation formula for competitions
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // supporter multiplier omitted because it should stay 1 (disabled)

      addResultToCompetitionScore(earnedXP);
    }

    // Apply XP visually and server-wise ----------------------------------
    XPbarResource.classList.remove("XPbarAnimate");

    if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) {
      XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
    }
    else {
      XPbarResource.style.width = uiSetUserXP(currentXP).fraction * 100 + "%"; // otherwise, set the starting point of the bar to the current xp
    }

    if (earnedXP > 0 && get(isAuthenticated)) {
      setUserXP(currentXP + earnedXP, earnedXP, false); //save XP, this is the last step! This function is async, but we don't await it as we set the XP to be currentXP + earnedXP in the ui anyway
    }

    setTimeout(function () {
      XPbarResource.classList.add("XPbarAnimate");
      XPbarResource.style.width = Math.max(uiSetUserXP(currentXP + earnedXP).fraction * 100, 4) + "%";
      resultLevelText.innerHTML = "+" + earnedXP + " XP";
      animateIncrement(resultLevelText, 0, earnedBasicXP, 1500);

      if (supporterMultiplier > 1 && earnedXP > earnedBasicXP) { // check if multiplier is greater than 1 + if it would actually make a difference
        supporterXpBoostAnimation(supporterMultiplier);

        animateSupporterBoostTimeout = setTimeout(() => {
          animateIncrement(resultLevelText, earnedBasicXP, earnedXP, 750);
        }, 3500);
      }
    }, 10);

  }
}
