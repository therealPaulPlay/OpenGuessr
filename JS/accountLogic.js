import { updateUsername as updateUsername, getUser, updateExperience } from "./userAPI";
import { setDailyChallengeExperienceResult } from "./dailyChallenge";
import { dailyChallengeTimer } from './dailyChallenge.js';
import { checkTextLength, toggleMobileMenu } from "./mainUI";
import { isHost, multiplayer, peerSendsHost, peerId, updatePeerDataScore, multiplayerCategory } from "./multiplayer.js";
import { checkIfGuessWasCorrect } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { getCountryFromCoords, currentStreetviewLat, currentStreetviewLong } from "./main.js";
import { mapMarkerLat, mapMarkerLong } from "./miniMap.js";
import { toggleStreakWindow } from "./rewardedAds.js";

let profileName = document.getElementById("profileViewName");

let profileInfo = document.getElementById("profileInfo");

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

let profileButton = document.getElementById("profileButton");
profileButton.addEventListener("click", () => {
  viewProfile();
  playSound("basic_button");
});

let mobileProfileButton = document.getElementById("mobileProfileButton");
mobileProfileButton.addEventListener("click", function () {
  toggleMobileMenu();
  playSound("basic_button");
  viewProfile();
});

let displayAccountName = document.getElementById("accountName");

let XPbarNoAccount = document.getElementById("XPbarNoAccount");
let XParea = document.getElementById("XParea");

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", () => {
  closeProfile();
  playSound("basic_button");
});

let profileWindow = document.getElementById("profileWindow");

//default is not logged in, so these are all disabled
logoutButton.style.display = "none";
profileButton.style.display = "none";
mobileLogoutButton.style.display = "none";
mobileProfileButton.style.display = "none";
XParea.style.display = "none";

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

let resultLevelText = document.getElementById("endScreenLevel");
let resultLevelDisplay = document.getElementById("endScreenLevelDisplay");

//Custom signup (WIP) -------------------------------------------------------------------------------------------------------------------

export let isAuthenticated = false; //true if user is logged in 

checkAuthenticationStatus();

function checkAuthenticationStatus() {
  let bearerToken = localStorage.getItem("bearer");

  if (bearerToken != null && bearerToken != "") {
    if (isTokenExpired(bearerToken)) {
      isAuthenticated = false;
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

function signout() {
  localStorage.removeItem("bearer"); //reset bearer token
  localStorage.removeItem("id");
  localStorage.removeItem("username");
  localStorage.removeItem("experience");
  localStorage.removeItem("selectedPin"); //also reset selected pin, as that is xp-based
  window.location.reload(); //reload website, so that UI etc. will be reset and all the loaded values aren't still showing
}

function goTologin() {
  window.location.href = "/signup.html";
}

//Account UI (working) -------------------------------------------------------------------------------------------------------------

XPbarNoAccount.addEventListener("click", function () {
  window.location.href = "/signup.html";
})

//part of checkSigninStatusAndLoadUserInfo
async function changeUItoSignedIn() {
  logoutButton.style.display = "inline-block";
  loginButton.style.display = "none";
  profileButton.style.display = "inline-block";
  mobileLogoutButton.style.display = "inline-block";
  mobileLoginButton.style.display = "none";
  mobileProfileButton.style.display = "inline-block";
  XPbarNoAccount.style.display = "none";
  XParea.style.display = "flex";
  enableExclusiveCategories();
  displayUserInfo();
}

let username;

//part of checkSigninStatusAndLoadUserInfo
function displayUserInfo() {
  uiSetUserXP(localStorage.getItem("experience"));
  username = localStorage.getItem("username");
  displayAccountName.innerHTML = username;
  profileName.innerHTML = username;
  checkTextLength();
}

//adjust the UI to the signin status and load user info on website load
async function checkSigninStatusAndLoadUserInfo() {
  if (isAuthenticated) {
    profileInfo.classList.remove("notSignedIn");
    //load user data - experience, username etc. could have been changed on a different device -> make sure to load them in!
    await getUser(localStorage.getItem("bearer"), localStorage.getItem("id"), "index").then(() => {
      changeUItoSignedIn(); // display user info is already being called in here
    });
  }
  else {
    profileInfo.classList.add("notSignedIn");
  }
}

function enableExclusiveCategories() {
  let accountLocked = document.getElementsByClassName("accountLock");
  let accountLockedArray = Array.from(accountLocked); // Convert to array
  for (let i = 0; i < accountLockedArray.length; i++) {
    accountLockedArray[i].classList.remove("accountLock");
  }

  document.getElementById("categoryExclusiveText").innerHTML = "You can now select these maps:";
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

  let levelXPbar = document.getElementById("progressBar");
  let levelText = document.getElementById("levelText");

  // Update the UI with the calculated level and XP progress
  if (isAuthenticated) {
    levelText.innerHTML = "Level " + templevel; //account ui level text
    resultLevelDisplay.innerHTML = "Lvl. " + templevel;
    levelXPbar.style.width = Math.max((xp / requiredXP) * 100, 12) + "%"; //account ui xp bar
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
  if (!multiplayer) {
    if (getCountryFromCoords(mapMarkerLat, mapMarkerLong) == getCountryFromCoords(currentStreetviewLat, currentStreetviewLong)) {
      streak++;
    } else {
      if (streak >= 2) {
        toggleStreakWindow(streak, false);
      }

      streak = 0; //reset country streak
    }

    localStorage.setItem("streak", streak);

    streakMultiplier = calculateMultiplier(streak);
    streakText.textContent = streak + " (" + streakMultiplier + "x)";

    streakDisplay.style.visibility = "visible";
    streakDisplay.style.width = "auto";
  }
}

function calculateXPGain(distance, category) {
  if (category == null || category == "standard" || category == "capital" || category == "hard") {

    streakCalculation();
    return Math.round((5000 * ((0.998036) ** distance)) * streakMultiplier);

  } else if (category == "europe" || category == "asia" || category == "africa" || category == "oceania" || category == "southamerica") {
    // not NA as that is literally US 95% of the time, therefore no streak
    streakCalculation();
    return Math.round((5000 * ((0.996036) ** distance)) * streakMultiplier); // slightly reduced xp range as continents are smaller than countries

  } else if (category == "famous" || (category && category.includes("community"))) {

    streakCalculation();
    return Math.round((1500 * ((0.998036) ** distance)) * streakMultiplier); //1000 xp for famous and community, with streak up to 1800sth

  } else if (category == "northamerica") {
    return Math.round(5000 * ((0.996036) ** distance)); 

  } else if (category == "daily") {
    let timeUsedInSeconds = 120 - dailyChallengeTimer.getRemainingTime();

    let timeFactor = Math.max(0, (120 - timeUsedInSeconds / 3) / 120);
    let tempEarnedXP = Math.round(5000 * ((0.998036) ** distance) * timeFactor);
    setDailyChallengeExperienceResult(tempEarnedXP);
    return tempEarnedXP;

  } else if (category == "country") {
    return checkIfGuessWasCorrect() ? 1000 : 0;

  } else if (category == "israel" || category == "austria" || category == "slovakia" || category == "czechia") { //very small countries, more reduced xp
    return Math.round(5000 * ((0.978036) ** distance));

  } else {
    return Math.round(5000 * ((0.988036) ** distance));//reduced XP for bad guesses in country locations (for better balance)
  }
}

export async function loadResultScreenXP(distance) {

  if (isAuthenticated || multiplayer) {
    //Checks whether or not the extra XP will cause the level to upgrade. Returns a value above 1 if yes. 
    let XPbarResource = document.getElementById("endScreenXPbarResource");

    let currentXP = Number(localStorage.getItem("experience"));

    if (currentXP == null) {
      currentXP = 0;
    }

    let selectedCategory = localStorage.getItem("selectedCategory");

    let earnedXP;

    streakDisplay.style.visibility = "hidden";
    streakDisplay.style.width = "0";

    //XP calculation formulas -------------------------------------------------
    if (!multiplayer) {
      earnedXP = calculateXPGain(distance, selectedCategory);

    } else {
      //always use the standard formula for multiplayer 
      earnedXP = calculateXPGain(distance, multiplayerCategory);

      if (isHost) {
        updatePeerDataScore(peerId, earnedXP);
      } else {
        peerSendsHost("score", earnedXP);
      }

    }

    //apply XP visually and server-wise ----------------------------------
    XPbarResource.classList.remove("XPbarAnimate");

    if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) {
      XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
    }
    else {
      XPbarResource.style.width = uiSetUserXP(currentXP).fraction * 100 + "%"; //otherwise, set the starting point of the bar to the current xp
    }

    if (earnedXP > 0 && isAuthenticated) {
      setUserXP(currentXP + earnedXP, false); //save XP, this is the last step! This function is async, but we don't await it as we set the XP to be currentXP + earnedXP in the ui anyway
    }

    setTimeout(function () {
      XPbarResource.classList.add("XPbarAnimate");
      XPbarResource.style.width = Math.max(uiSetUserXP(currentXP + earnedXP).fraction * 100, 4) + "%";
      resultLevelText.innerHTML = "+" + earnedXP + " XP";
      animateIncrement(resultLevelText, 0, earnedXP, 1500);
    }, 10);
  }
}

//Save / Set user XP ----------------------------------------------------------------------------------------------

export async function setUserXP(xp, secondAttempt) {
  let state;

  try {
    state = await updateExperience(localStorage.getItem("bearer"), localStorage.getItem("id"), xp, "index", secondAttempt);
  } catch (error) {
    console.error("Error setting User XP in accountLogic.js: " + error);
    if (state == "retry") {
      reattemptExperienceUpdate();
    }
  }

}

export async function reattemptExperienceUpdate() {
  try {
    await checkSigninStatusAndLoadUserInfo();
    setUserXP(Number(localStorage.getItem("experience")) + earnedXP, true);
  } catch (error) {
    console.error("Re-attempting the XP update failed: " + error);
  }
}


//Profile Window ---------------------------------------------------------------------------------------------

function viewProfile() {
  username = localStorage.getItem("username");
  profileWindow.style.display = "block";
  document.getElementById("blackBackground").style.visibility = "visible";
  profileName.innerHTML = username;
  document.getElementById("statisticExperience").innerHTML = "Total experience: " + Number(localStorage.getItem("experience")).toLocaleString();
  document.getElementById("statisticUpgradeExperience").innerHTML = "Required for next level: " + uiSetUserXP(Number(localStorage.getItem("experience"))).requiredForLevelUpgrade.toLocaleString();
  updatePinLocks(localStorage.getItem("experience"));

}

function closeProfile() {
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

let newUsername;

async function updateProfileUsername() {
  newUsername = document.getElementById("usernameInput").value;
  toggleUsernameView();
  if (newUsername != "") {
    await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then(() => {
      //updateUsername saves the new name in localstorage
      displayUserInfo();
    });
  }
}

//Pin selection -------------------------------------------------------------------------------------------------------

export let selectedPinIndex = 0;

// Function to handle pin selection
function selectPin(index, sound) {
  // Check if the pinHolder and pinLock exist
  const pinHolders = document.querySelectorAll('.pinHolder');
  if (pinHolders.length > index) {
    const pinLock = pinHolders[index].querySelector('.pinLock');
    if (pinLock && (pinLock.style.display === 'none' || pinLock.style.display === '')) {
      // Remove selectedPin class from all pinHolder buttons
      document.querySelectorAll('.pinHolder').forEach(function (btn) {
        btn.classList.remove('selectedPin');
      });

      // Add selectedPin class to the clicked pinHolder button
      pinHolders[index].classList.add('selectedPin');

      if (sound) {
        playSound("item_select");
      }

      if (index != null || typeof (index) == "number") {
        // Set selectedPin index to localStorage
        selectedPinIndex = index;
        localStorage.setItem("selectedPin", index);
      }
    } else {
      if (sound) {
        playSound("pin_locked");
      }
    }
  }
}


// Function to load selected pin from localStorage
function loadSelectedPin() {
  selectedPinIndex = parseInt(localStorage.getItem('selectedPin'));

  if (isNaN(selectedPinIndex) || selectedPinIndex == undefined || selectedPinIndex > 5 || selectedPinIndex == null) {
    selectedPinIndex = 0;
  }

  selectPin(selectedPinIndex);
}

// Function to update pinLocks based on XP
function updatePinLocks(xpAmount) {

  const pinLocks = document.querySelectorAll('.pinLock');
  pinLocks.forEach(function (lock) {
    const lockXP = parseInt(lock.querySelector('.pinLockText').textContent.replace(/,/g, ''));
    if (xpAmount >= lockXP) {
      lock.style.display = "none"; // Hide pinLock if XP is enough
    } else {
      lock.style.display = "flex"; // Show pinLock if XP is not enough
    }
  });
}

// Add click event listener to pinHolder buttons
document.querySelectorAll('.pinHolder').forEach(function (btn, index) {
  btn.addEventListener('click', function () {
    selectPin(index, true); // Call selectPin function on button click
  });
});


document.addEventListener("DOMContentLoaded", function () {
  // Load selected pin when the page loads
  loadSelectedPin();
  updatePinLocks(localStorage.getItem("experience"));

});

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
