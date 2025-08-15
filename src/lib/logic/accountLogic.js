import { attemptJoinViaLink } from "$lib/logic/multiplayerLogic";
import { initializeSSEConnection } from "$lib/logic/sseLogic";
import { resultScreenEnabled, lastDistance, lastExperienceCalculationAborted } from "$lib/stores/context-specific/resultScreenStore";
import { isAuthenticated, supporterLevel, experience, username, selectedPinIndex, selectedBadge, elo, tokens, purchasedPins, accountDataLoaded, duelWinStreak } from "$lib/stores/accountStore";
import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
import { isTokenExpired } from "$lib/utils/isTokenExpired.js";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { get } from "svelte/store";
import { supportedAmount } from "$lib/stores/accountStore.js";
import { showNotification } from "$lib/utils/notifications";
import { freeDailyTokensClaimed } from "$lib/stores/context-specific/shopStore";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { errorPopup } from "$lib/utils/errorHandling";

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
  // Localstorage resets
  localStorage.removeItem("bearer");
  localStorage.removeItem("id");

  // Store resets
  username.set("Guest");
  selectedPinIndex.set(0);
  selectedBadge.set(null);
  inboxIconNew.set(false);
  experience.set(0);
  supportedAmount.set(0);
  supporterLevel.set(0);
  elo.set(1000);
  tokens.set(0);
  purchasedPins.set([]);
  freeDailyTokensClaimed.set(false);

  // Set account loaded to false
  accountDataLoaded.set(false);
}

// Load user data ---------------------------------------------------------------------------------------------------------------------------
async function loadUserInfo() {
  try {
    await getUser().then((user) => {

      if (!user) return; // If an error occured and no data is provided, exit

      // Extract profile data
      experience.set(user.experience);
      username.set(user.userName);
      supporterLevel.set(user.supporter_level);
      supportedAmount.set(user.supported_amount);
      selectedPinIndex.set(user.pin || 0);
      selectedBadge.set(user.badge || null);
      elo.set(user.elo);
      tokens.set(user.tokens);
      purchasedPins.set(user.purchased_pins || []);
      freeDailyTokensClaimed.set(user.free_tokens_claimed || false);
      duelWinStreak.set(user.current_duel_win_streak || 0);

      if (get(resultScreenEnabled) && get(lastExperienceCalculationAborted)) loadResultScreenXP(get(lastDistance));
      if (user.new_requests) { inboxIconNew.set(true); }

      initializeSSEConnection();
      accountDataLoaded.set(true);
    });
  } catch (error) {
    console.error("Error getting user data in loadUserInfo:", error);
  }
}

async function getUser() {
  try {
    const response = await fetch(`${get(accountUrl)}/accounts/user/${localStorage.getItem("id")}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("bearer")}`
      },
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      return data.user;

    } else {
      let responseError = response.status;
      try {
        const data = await response.json();
        if (data.error) responseError = data.error;
      } catch { }

      if (response.status == 404) {
        showConfirmPopup("Account removed", "This account was removed. Your locally saved account data should be deleted to avoid issues. Continue?", () => {
          localStorage.removeItem("id");
          localStorage.removeItem("bearer");
          window.location.reload();
        }, false, false, false, "Continue");
      } else {
        throw new Error(responseError);
      }
    }
  } catch (error) {
    console.error('Error fetching the user: ', error);
    errorPopup("Error fetching user", "An error occured trying to fetch user info.", error.message);
  }
}