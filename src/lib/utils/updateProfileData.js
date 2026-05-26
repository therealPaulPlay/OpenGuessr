import { getProfileData } from "$lib/utils/getProfileData";
import { selectedBadge, selectedPinIndex } from "$lib/stores/accountStore";
import { profileData, unsavedAboutChanges } from "$lib/stores/context-specific/profileStore";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { errorPopup } from "./errorHandling";

// Generic function to update a single profile field
async function updateSingleProfileField(type, value) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            type,
            value
        };

        const response = await fetch(get(apiUrl) + "/accounts/profile/update-replace", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('Profile update failed: ', response.status);
            errorPopup("Profile update failed", "The server returned an error for the profile update.", response.status);
        }

        return true;
    } catch (error) {
        console.error('Error occurred during profile update: ', error);
        errorPopup("Profile update failed", "The profile update failed due to a network error.", error);
    }
}

// Save about text if there are unsaved changes
export async function saveProfileAboutIfChanges(newAbout) {
    if (get(unsavedAboutChanges)) {
        unsavedAboutChanges.set(false);
        await updateSingleProfileField('about', newAbout);
    }
}

// Update selected pin
export async function setSelectedProfilePin(pinId) {
    if (pinId == get(selectedPinIndex)) return; // Check if the new selection is different from the current one
    profileData.update((value) => {
        const newObject = value;
        newObject["pin"] = pinId;
        return newObject;
    });
    selectedPinIndex.set(pinId);
    await updateSingleProfileField('pin', pinId);
}

// Update selected badge
export async function setProfileBadge(badge) {
    if (badge == get(selectedBadge)) badge = null; // If the user clicks on the selected badge again, deselect it

    profileData.update((value) => {
        const newObject = value;
        newObject["badge"] = badge;
        return newObject;
    });
    selectedBadge.set(badge);
    await updateSingleProfileField('badge', badge);
}

// Update flag
export async function setProfileFlag(flag) {
    await updateSingleProfileField('flag', flag);
}

// Check and set new highest country streak (only if higher than current)
export async function updateProfileIfNewBestStreak(streak) {
    try {
        // Get current profile data to check existing highest streak
        const data = await getProfileData(localStorage.getItem("id"));
        if (data) {
            const currentHighest = data?.highestCountryStreak || 0;
            if (streak > currentHighest) await updateSingleProfileField('highest_country_streak', streak); // Only update if the new streak is higher
        }

    } catch (error) {
        console.error("Error checking/setting country streak:", error);
    }
}