import { getUser } from "./userAPI";
import { attemptJoinViaLink } from "$lib/logic/multiplayerLogic";
import { initializeSSEConnection } from "$lib/logic/sseLogic";
import { resultScreenEnabled, lastDistance, lastExperienceCalculationAborted } from "$lib/stores/context-specific/resultScreenStore";
import { isAuthenticated, supporterLevel, experience, username, selectedPinIndex, selectedBadge, elo } from "$lib/stores/accountStore";
import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
import { isTokenExpired } from "$lib/utils/isTokenExpired.js";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { get } from "svelte/store";
import { supportedAmount } from "$lib/stores/accountStore.js";
import { showNotification } from "$lib/utils/notifications";

// Authentication -----------------------------------------------------------------------------------------------------------------------

// Global function that changes everything to logged in or signed out
export async function checkAuthenticationStatus() {
  const bearerToken = localStorage.getItem("bearer");

  if (bearerToken) {
    if (!isTokenExpired(bearerToken)) {
      isAuthenticated.set(true);
      await loadUserInfo();
    } else {
      isAuthenticated.set(false);
      resetLocalSave();
      showNotification("Your session has expired.");
    }
  } else {
    isAuthenticated.set(false);
  }

  attemptJoinViaLink();
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
      // Extract profile data
      experience.set(user?.experience);
      username.set(user?.userName);
      supporterLevel.set(user?.supporter_level);
      supportedAmount.set(user?.supported_amount);
      selectedPinIndex.set(user?.profile_data?.pin || 0);
      selectedBadge.set(user?.profile_data?.badge || null);
      elo.set(user?.elo || 1000);

      if (get(resultScreenEnabled) && get(lastExperienceCalculationAborted)) loadResultScreenXP(get(lastDistance));
      if (user?.new_requests) { inboxIconNew.set(true); }

      initializeSSEConnection();
    });
  } catch (error) {
    console.error("Error getting user data in loadUserInfo:", error);
  }
}