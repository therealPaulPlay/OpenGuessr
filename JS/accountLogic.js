import { deleteUser, getUser, updateExperience } from "./userAPI";
import { checkTextLength, freeSupporterBoostEnabled, resultScreenEnabled, setAdVisibility, showConfirmPopup, showPageBrowser, supporterXpBoostAnimation, toggleMobileMenu } from "./mainUI";
import { isHost, multiplayer, peerSendsHost, peerId, updatePeerDataScore, multiplayerCategory, highestMultiplayerSupporterLevel, attemptJoinViaLink } from "./multiplayer.js";
import { checkIfGuessWasCorrect } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { getCountryFromCoords, currentStreetviewLat, currentStreetviewLong } from "./main.js";
import { mapMarkerLat, mapMarkerLong } from "./miniMap.js";
import { toggleStreakWindow } from "./streakAdPopup.js";
import { addResultToCompetitionScore, playingCompetition } from "./competitionLogic.js";
import { closeProfile, loadProfileFromId, setCheckNewHighestStreak, loadSelectedPin, updateLoadedProfileData, loadSelectedBadge, setSupporterLevel, supporterLevel } from "./profileView.js";
import { errorPopup } from "./errorHandling.js";
import { initializeWebsocketConnection, setInboxStatus } from "./friendMenu.js";

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
  toggleMobileMenu();
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
  toggleMobileMenu();
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
  showConfirmPopup("Delete your Account", "Please input your password to confirm the account deletion. Make sure to delete user-created content before proceeding, if you wish to remove that from the platform.", submitAccountDeletion, true);
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

export let isAuthenticated = false; //true if user is logged in 

checkAuthenticationStatus();

// Global function that changes everything to logged in or signed out (all other sign-in functions are related to this)
export function checkAuthenticationStatus() {
  let bearerToken = localStorage.getItem("bearer");

  if (bearerToken != null && bearerToken != "") {
    if (isTokenExpired(bearerToken)) {
      isAuthenticated = false;
      resetLocalSave();
    }
    else {
      isAuthenticated = true;
    }
  }
  else {
    isAuthenticated = false;
  }
  checkSigninStatusAndLoadUserInfo(); //set UI accordingly
}


/* this should decode the token and return expired (true/false) - only works if the token is not encrypted,
otherwise we will need a jwt token verifier (with public key) */
function isTokenExpired(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  try {
    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;
    return expired;
  }

  catch {
    expired = false;
    return expired;
  }

}

//these are being accessed from index.htm

function resetLocalSave() {
  localStorage.removeItem("bearer");
  localStorage.removeItem("id");
  localStorage.removeItem("username");
  localStorage.removeItem("experience");
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

  if (resultScreenEnabled && lastXPloadingAttemptAborted) {
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
  uiSetUserXP(localStorage.getItem("experience"));
  displayAccountName.innerHTML = localStorage.getItem("username");
  checkTextLength();
}

async function checkSigninStatusAndLoadUserInfo() {
  if (isAuthenticated) {
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

  document.getElementById("categoryExclusiveText").innerHTML = "You can now select these maps:";
}

function disableExlcusiveCategories() {
  if (accountLockedArray) {
    for (let i = 0; i < accountLockedArray.length; i++) {
      accountLockedArray[i].classList.add("accountLock");
    }
  }

  document.getElementById("categoryExclusiveText").innerHTML = " Sign up to unlock for free: ";
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

  if (isAuthenticated) {
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

//Calculate XP gain for each round ---------------------------------------------------------------------------------------
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

function streakCalculation() {
  if (!multiplayer && !playingCompetition) {
    if (getCountryFromCoords(mapMarkerLat, mapMarkerLong) == getCountryFromCoords(currentStreetviewLat, currentStreetviewLong)) {
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

function calculateXPGain(distance, category, supporterLevel, freeSupporterBoost) {
  let returnXP = 0;

  if (category == null || category == "standard" || category == "capital" || category == "hard") {

    streakCalculation();
    returnXP = Math.round((5000 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode());

  } else if (category == "europe" || category == "asia" || category == "africa" || category == "oceania" || category == "southamerica") {
    // not NA as that is literally US 95% of the time, therefore no streak
    streakCalculation();
    returnXP = Math.round((5000 * ((0.996036) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // slightly reduced xp range as continents are smaller than countries

  } else if (category == "famous" || category == "image") {

    streakCalculation();
    returnXP = Math.round((1500 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // 1500 xp for famous, with streak up to 1800sth

  } else if (category && category.includes("community")) {

    streakCalculation();
    returnXP = Math.round((3000 * ((0.994036) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // 3000 xp for community, with streak slightly more - also adjusted distance function

  } else if (category == "northamerica") {
    returnXP = Math.round(5000 * ((0.996036) ** distance));

  } else if (category == "country") {
    returnXP = checkIfGuessWasCorrect() ? 1000 : 0;

  } else if (category == "israel" || category == "austria" || category == "slovakia" || category == "czechia") { // very small countries, more reduced xp
    returnXP = Math.round(5000 * ((0.978036) ** distance));

  } else {
    returnXP = Math.round(5000 * ((0.988036) ** distance)); // reduced XP for bad guesses in country locations (for better balance)
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

  if (!isAuthenticated && !multiplayer) {
    lastXPloadingAttemptAborted = true;
  }

  if (isAuthenticated || multiplayer) {
    lastXPloadingAttemptAborted = false;

    //Checks whether or not the extra XP will cause the level to upgrade. Returns a value above 1 if yes. 
    let XPbarResource = document.getElementById("endScreenXPbarResource");

    let currentXP = Number(localStorage.getItem("experience"));

    if (currentXP == null) {
      currentXP = 0;
    }

    let selectedCategory = localStorage.getItem("selectedCategory");

    streakDisplay.style.opacity = "0";
    streakDisplay.style.width = "0";
    streakDisplay.style.maxWidth = "0";

    let earnedXP;
    let earnedBasicXP; // without supporter mutliplier, that will be applied later (this is just for visuals)

    // XP calculation formulas -------------------------------------------------
    if (!multiplayer && !playingCompetition) {
      const calculatedXP = calculateXPGain(distance, selectedCategory, supporterLevel, freeSupporterBoostEnabled);
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

    } else if (multiplayer) {
      //always use the standard formula for multiplayer 
      const calculatedXP = calculateXPGain(distance, multiplayerCategory, highestMultiplayerSupporterLevel);
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

      if (isHost) {
        updatePeerDataScore(peerId, earnedXP);
      } else {
        peerSendsHost("score", earnedXP);
      }

    } else if (playingCompetition) {
      const calculatedXP = calculateXPGain(distance, "standard"); // always use standard calculation formula for competitions
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // supporter multiplier omitted because it should stay 1 (disabled)

      addResultToCompetitionScore(earnedXP);
    }

    //apply XP visually and server-wise ----------------------------------
    XPbarResource.classList.remove("XPbarAnimate");

    if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) {
      XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
    }
    else {
      XPbarResource.style.width = uiSetUserXP(currentXP).fraction * 100 + "%"; // otherwise, set the starting point of the bar to the current xp
    }

    if (earnedXP > 0 && isAuthenticated) {
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

//Save / Set user XP ----------------------------------------------------------------------------------------------

export async function setUserXP(newExp, earnedExp, secondAttempt) {
  let state;

  try {
    state = await updateExperience(localStorage.getItem("bearer"), localStorage.getItem("id"), newExp, "index", secondAttempt);
    if (state == "retry" && earnedExp != 0) {
      reattemptExperienceUpdate(earnedExp);
    }
  } catch (error) {
    console.error("Error setting User XP in accountLogic.js: " + error);
  }

}

export async function reattemptExperienceUpdate(earnedExp) {
  try {
    console.warn("Re-attempting XP set due to error 400 (local save behind)")
    await checkSigninStatusAndLoadUserInfo(); // load new player details again
    setUserXP(Number(localStorage.getItem("experience")) + earnedExp, 0, true);
  } catch (error) {
    console.error("Re-attempting the XP update failed: " + error);
  }
}

//Animate currency values to tick up gradually -----------------------------------------------------------------------

function animateIncrement(element, startValue, endValue, duration) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1); // Progress from 0 to 1
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3); // Ease-out cubic function
    const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic(progress));

    // Update only the XP part of the text while keeping the rest intact
    const originalText = element.dataset.originalText;
    element.innerHTML = originalText.replace(/(\+\d+)\s*(XP)/, `+${currentValue} $2`);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.innerHTML = originalText.replace(/(\+\d+)\s*(XP)/, `+${endValue} $2`); // Ensure it ends at the exact endValue
    }
  }

  // Store the original text in a data attribute if not already done
  if (!element.dataset.originalText) {
    element.dataset.originalText = element.innerHTML;
  }

  requestAnimationFrame(step);
}
