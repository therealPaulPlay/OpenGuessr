import { getUser } from "./userAPI";
// import { supporterXpBoostAnimation } from "../../../JS/mainUI.js"; !TODO !CHANGE
// import { peerSendsHost, updatePeerDataScore } from "../../../JS/multiplayer.js"; !TODO !CHANGE
import { attemptJoinViaLink } from "$lib/logic/multiplayerLogic";
import { highestMultiplayerSupporterLevel, multiplayerCategory, isHost, peerId } from "$lib/stores/context-specific/multiplayerStore.js";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuesserFunctions.js";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore.js";
import { getCountryFromCoords } from "$lib/utils/countryFromCoordinates.js";
import { mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore.js";
import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";
import { addResultToCompetitionScore } from "$lib/logic/competitionLogic.js";
import { setCheckNewHighestStreak } from "$lib/utils/updateProfileData";
import { initializeWebsocketConnection } from "$lib/logic/websocketLogic.js";
import { setUserXP } from "$lib/utils/setUserXP";
import { resultScreenEnabled, experienceBarAnimated, earnedExperience, showStreakDisplay, streakText } from "$lib/stores/context-specific/resultScreenStore.js";
import { animateIncrement } from "$lib/utils/animateIncrement.js";
import { isAuthenticated, supporterLevel, experience, freeSupporterBoostEnabled, username, selectedPinIndex, selectedBadge } from "$lib/stores/accountStore";
import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
import { isTokenExpired } from "$lib/utils/isTokenExpired.js";
import { competition, multiplayer } from "$lib/stores/modeStore.js";
import { saveRoundToLog } from "$lib/utils/saveRoundToLog.js";
import { mapDiameter } from "$lib/stores/context-specific/mapStore.js";
import { get } from "svelte/store";
import { supportedAmount } from "$lib/stores/accountStore.js";

let lastDistance;
let lastXPloadingAttemptAborted = false;

// Authentication -----------------------------------------------------------------------------------------------------------------------

// Global function that changes everything to logged in or signed out
export async function checkAuthenticationStatus() {
  let bearerToken = localStorage.getItem("bearer");

  if (bearerToken) {
    if (!isTokenExpired(bearerToken)) {
      isAuthenticated.set(true);
      await loadUserInfo();
    }
    else {
      isAuthenticated.set(false);
      resetLocalSave();
    }
  }
  else {
    isAuthenticated.set(false);
  }

  try { attemptJoinViaLink(); } catch (e) { console.error("Error in accountLogic.js:", e) };
}

export function resetLocalSave() {
  // Localstorage
  localStorage.removeItem("bearer");
  localStorage.removeItem("id");
  localStorage.removeItem("experience");

  // Stores
  username.set("Guest");
  selectedPinIndex.set(0);
  selectedBadge.set(null);
  inboxIconNew.set(false);
  experience.set(0);
}

// Load user data ---------------------------------------------------------------------------------------------------------------------------
async function loadUserInfo() {
  try {
    await getUser(localStorage.getItem("bearer"), localStorage.getItem("id"), "index").then((user) => {
      // Extract profile cosmetics
      experience.set(user.experience);
      username.set(user.userName);
      supporterLevel.set(user.supporter_level);
      supportedAmount.set(user.supportd_amount);
      selectedPinIndex.set(user?.profile_data?.pin || 0);
      selectedBadge.set(user?.profile_data?.badge || null);


      if (get(resultScreenEnabled) && lastXPloadingAttemptAborted) loadResultScreenXP(lastDistance);
      if (user.new_requests) { inboxIconNew.set(true); }

      initializeWebsocketConnection();
    });
  } catch (error) {
    console.error("Error getting user data in loadUserInfo:", error);
  }
}

// Streak ----------------------------------------------------------------------------------------------------------------------------------------------------
let streak = 0;

function loadStreak() {
  let tempLoadedStreak = localStorage.getItem("streak");

  if (tempLoadedStreak != null) {
    streak = Number(tempLoadedStreak);
  }
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
  loadStreak();

  streak = oldStreak;
  localStorage.setItem("streak", streak);
  streakMultiplier = calculateMultiplier(streak);

  streakText.set(streak + " (" + streakMultiplier + "x)");
}

async function streakCalculation() {
  if (!get(multiplayer) && !get(competition)) {
    loadStreak(); // Load streak from localstorage

    if (await getCountryFromCoords(get(mapPinLat), get(mapPinLng)) == await getCountryFromCoords(get(currentLocationLatitude), get(currentLocationLongitude))) {
      streak++;
    } else {
      if (streak >= 2) {
        get(toggleStreakRestoreWindow)(streak, false);
      }

      setCheckNewHighestStreak(streak); // checks if this was the highest streak yet and 

      streak = 0; //reset country streak ( = Streak lost, but still restorable wit ad)
    }

    localStorage.setItem("streak", streak);
    streakText.set(streak + " (" + streakMultiplier + "x)");

    showStreakDisplay.set(true);
  }
}

function getStreakMultiplierAdjustedToGamemode() {
  if (!get(multiplayer) && !get(competition)) {
    return streakMultiplier;
  } else {
    return 1;
  }
}

// Adjust XP calculation parameter to diameter (map size)
function calculateExponentialModifier(mapDiameter) {
  const A = 0.9978;
  const B = 0.08;
  const C = 0.06;
  return A - B * Math.exp(-C * mapDiameter);
}

// Calculate XP gain --------------------------------------------------------------------------------------------------------------------------------

async function calculateXPGain(distance, category, supporterLevel, freeSupporterBoost) {
  let returnXP = 0;

  if (!category || category == "standard" || category == "capital") {
    await streakCalculation();
    returnXP = Math.round((5000 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode());

  } else if (category == "famous" || category == "image") {
    await streakCalculation();
    returnXP = Math.round((1500 * ((0.998036) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // 1500 xp, with streak up to 1800sth

  } else if (category == "country") {
    returnXP = checkIfGuessWasCorrect() ? 1000 : 0;

  } else {
    if (get(mapDiameter) > 250) await streakCalculation(); // If the map is big enough, calculate the country streak
    returnXP = Math.round(5000 * ((calculateExponentialModifier(get(mapDiameter))) ** distance));
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


// Load Experience stats on result screen -----------------------------------------------------------------------------------------------------------------------------
export async function loadResultScreenXP(distance) {

  let supporterMultiplier = 1;
  clearTimeout(animateSupporterBoostTimeout);

  lastDistance = distance;

  if (!get(isAuthenticated) && !get(multiplayer)) lastXPloadingAttemptAborted = true;

  // Save played round to log ------------------------------------------------
  let mode = "Singleplayer";
  if (get(multiplayer)) mode = "Multiplayer";
  if (get(competition)) mode = "Competition";

  saveRoundToLog(mode, distance, [get(currentLocationLatitude), get(currentLocationLongitude)]);

  // If Authenticated or in Multiplayer, show XP thing ------------------------------
  if (get(isAuthenticated) || get(multiplayer)) {
    lastXPloadingAttemptAborted = false;

    let currentXP = Number(get(experience)) || 0;
    let selectedCategory = localStorage.getItem("selectedCategory");

    // Hide streak display
    showStreakDisplay.set(false);

    let earnedXP;
    let earnedBasicXP; // without supporter mutliplier, that will be applied later (this is just for visuals)

    // XP calculation formulas -------------------------------------------------
    if (!get(multiplayer) && !get(competition)) {
      const calculatedXP = await calculateXPGain(distance, selectedCategory, get(supporterLevel), get(freeSupporterBoostEnabled));
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

    } else if (get(multiplayer)) {
      //always use the standard formula for multiplayer 
      const calculatedXP = await calculateXPGain(distance, get(multiplayerCategory), get(highestMultiplayerSupporterLevel));
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
      supporterMultiplier = calculatedXP.supporterMultiplier;

      if (get(isHost)) {
        updatePeerDataScore(get(peerId), earnedXP);
      } else {
        peerSendsHost("score", earnedXP);
      }

    } else if (get(competition)) {
      const calculatedXP = await calculateXPGain(distance, "standard");
      earnedXP = calculatedXP.earnedXP;
      earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // supporter multiplier omitted because it should stay 1 (disabled)
      addResultToCompetitionScore(earnedXP);
    }

    // Apply XP visually and server-wise ----------------------------------

    experienceBarAnimated.set(false);
    earnedExperience.set(earnedBasicXP);

    if (earnedXP > 0 && get(isAuthenticated)) {
      setUserXP(currentXP + earnedXP); // Save XP to database
      experienceBarAnimated.set(true);
    }

    setTimeout(function () {
      animateIncrement(document.getElementById("endScreenXP"), 0, earnedBasicXP, 1500);

      if (supporterMultiplier > 1 && earnedXP > earnedBasicXP) { // check if multiplier is greater than 1 + if it would actually make a difference
        supporterXpBoostAnimation(supporterMultiplier);

        animateSupporterBoostTimeout = setTimeout(() => {
          earnedExperience.set(earnedXP);
          animateIncrement(document.getElementById("endScreenXP"), earnedBasicXP, earnedXP, 750);
        }, 3500);
      }
    }, 10);

  }
}