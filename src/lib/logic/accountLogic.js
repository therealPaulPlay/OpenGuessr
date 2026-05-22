import { resultScreenEnabled, lastDistance, lastExpCalculationSignedOut } from "$lib/stores/context-specific/resultScreenStore";
import { isAuthenticated, supporterLevel, experience, username, selectedPinIndex, selectedBadge, elo, tokens, purchasedPins, accountDataLoaded, duelWinStreak } from "$lib/stores/accountStore";
import { newFriendRequest } from "$lib/stores/context-specific/inboxStore";
import { isTokenExpired } from "$lib/utils/isTokenExpired.js";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { get } from "svelte/store";
import { supportedAmount } from "$lib/stores/accountStore.js";
import { showNotification } from "$lib/utils/notifications";
import { freeDailyTokensClaimed } from "$lib/stores/context-specific/shopStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { errorPopup } from "$lib/utils/errorHandling";

// Authentication -----------------------------------------------------------------------------------------------------------------------

let callbacks = new Set();

// Global function that changes everything to logged in or signed out
export async function checkAuthentication() {
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
  } else isAuthenticated.set(false);

  // Run callbacks
  callbacks.forEach(async (funcItem) => {
    try {
      await funcItem(get(isAuthenticated));
    } catch (error) {
      console.error("Error in checkAuthentication callback:", error);
    }
  });
}

export function signOut() {
  resetLocalSave();
  checkAuthentication();
}

function resetLocalSave() {
  // Localstorage resets
  localStorage.removeItem("bearer");
  localStorage.removeItem("id");

  // Store resets
  username.set("Guest");
  selectedPinIndex.set(0);
  selectedBadge.set(null);
  experience.set(0);
  supportedAmount.set(0);
  supporterLevel.set(0);
  elo.set(1000);
  tokens.set(0);
  purchasedPins.set([]);
  freeDailyTokensClaimed.set(false);
  duelWinStreak.set(0);
  newFriendRequest.set(false);

  // Set account loaded to false
  accountDataLoaded.set(false);
}

// Register a callback, returns an unsubscribe function
export function onAuthenticationUpdated(callback) {
  if (!callback || typeof callback !== "function") {
    console.warn("Called onAuthenticationUpdated without a valid callback function!");
    return () => { };
  }
  if (callbacks.has(callback)) console.error("Callback already registered.");
  callbacks.add(callback);
  return () => callbacks.delete(callback);
}

// Load user data ---------------------------------------------------------------------------------------------------------------------------
async function loadUserInfo() {
  try {
    await getUser().then((user) => {

      if (!user) return; // If an error occured and no data is provided, exit

      // Extract profile data
      experience.set(user.experience);
      username.set(user.username);
      supporterLevel.set(user.supporter_level);
      supportedAmount.set(user.supported_amount);
      elo.set(user.elo);
      tokens.set(user.tokens);

      // Extract optional profile data
      if (user.pin != null) selectedPinIndex.set(user.pin);
      if (user.badge != null) selectedBadge.set(user.badge);
      if (user.purchased_pins) purchasedPins.set(user.purchased_pins);
      if (user.free_tokens_claimed != null) freeDailyTokensClaimed.set(user.free_tokens_claimed);
      if (user.current_duel_win_streak != null) duelWinStreak.set(user.current_duel_win_streak);
      if (user.new_request) { newFriendRequest.set(true); }

      // If the user signed in on the result screen with a pending result, re-run it
      if (get(resultScreenEnabled) && get(lastExpCalculationSignedOut)) loadResultScreenXP(get(lastDistance));

      accountDataLoaded.set(true);
    });
  } catch (error) {
    console.error("Error getting user data in loadUserInfo:", error);
    if (error.message === "404") {
      showConfirmPopup("Account removed", "This account was removed. Delete locally saved data?", () => {
        resetLocalSave();
        window.location.reload();
      });
    } else {
      errorPopup("Error getting user data", "An error occured trying to fetch user info.", error.message);
    }
  }
}

async function getUser() {
  const response = await fetch(`${get(apiUrl)}/accounts/user/${localStorage.getItem("id")}`, {
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
    if (response.status == 404) throw new Error("404");
    try {
      const data = await response.json();
      if (data.error) responseError = data.error;
    } catch { }
    throw new Error(responseError);
  }
}