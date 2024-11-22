import { getProfileData } from "$lib/utils/getProfileData";
import { selectedBadge, selectedPinIndex } from "$lib/stores/accountStore";
import { profileId, unsavedAboutChanges } from "$lib/stores/context-specific/profileStore";
import { get } from "svelte/store";

export async function updateProfileData(newAboutText, addDuelsPlayed, addDuelsWon, addCompetitionsPlayed, setHighestStreak, newPin, newBadge) {
    try {
        const data = await getProfileData(localStorage.getItem("id"));
        const yourLoadedProfileData = data.profileData || {};

        // about text
        let aboutText;
        aboutText = yourLoadedProfileData?.about || "";
        if (newAboutText) aboutText = newAboutText;

        // duels played
        let duelsPlayed;
        duelsPlayed = yourLoadedProfileData?.duelsPlayed || 0;
        if (addDuelsPlayed) duelsPlayed += addDuelsPlayed;

        // duels won
        let duelsWon;
        duelsWon = yourLoadedProfileData?.duelsWon || 0;
        if (addDuelsWon) duelsWon += addDuelsWon;

        // competitions played
        let competitionsPlayed;
        competitionsPlayed = yourLoadedProfileData?.competitionsPlayed || 0;
        if (addCompetitionsPlayed) competitionsPlayed += addCompetitionsPlayed;

        // streak
        let newStreak;
        newStreak = yourLoadedProfileData?.highestStreak || 0;
        if (setHighestStreak && newStreak < setHighestStreak) newStreak = setHighestStreak;

        // pin
        let pin;
        pin = yourLoadedProfileData?.pin || 0;
        if (newPin) pin = newPin;

        // badge
        let badge;
        badge = yourLoadedProfileData?.badge || null;
        if (newBadge) badge = newBadge;

        const profileData = {
            about: aboutText,
            duelsPlayed: duelsPlayed,
            duelsWon: duelsWon,
            competitionsPlayed: competitionsPlayed,
            highestStreak: newStreak,
            pin: pin,
            badge: badge
        }

        submitProfileData(profileData);
    } catch (error) {
        console.error("Error in updateProfileData:", error);
    }
}

export async function saveProfileAboutIfYourProfileAndChanges(newAbout) {
    if (get(profileId) == localStorage.getItem("id") && get(unsavedAboutChanges)) {
        updateProfileData(newAbout);
        unsavedAboutChanges.set(false);
    }
}

export async function addDuelPlayed() {
    updateProfileData(null, 1);
}

export async function addDuelWon() { // also adds 1 to duel played
    updateProfileData(null, 1, 1);
}

export async function addCompetitionPlayed() {
    updateProfileData(null, null, null, 1);
}

export async function setCheckNewHighestStreak(streak) {
    updateProfileData(null, null, null, null, streak);
}

export async function setSelectedProfilePin(pinId) {
    if (pinId == get(selectedPinIndex)) return; // Detect if the new selection is different from the current one
    selectedPinIndex.set(pinId);
    updateProfileData(null, null, null, null, null, pinId);
}

export async function setProfileBadge(badge) {
    if (badge == get(selectedBadge)) return; // Detect if the new selection is different from the current one
    selectedBadge.set(badge);
    updateProfileData(null, null, null, null, null, null, badge);
}

async function submitProfileData(profileDataObject) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            profileData: JSON.stringify(profileDataObject)
        }

        // Make the PUT request using Fetch API
        const response = await fetch("https://accounts.openguessr.com/accounts/profile/update", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        // Check if the response is successful
        if (response.ok) {

        } else {
            console.error('Profile update failed: ', response.status);
            errorPopup("Profile update failed", "The server returned an error for the profile update.", response.status, false, false);
        }

    } catch (error) {
        console.error('Error occurred during profile update: ', error);
        errorPopup("Profile update failed", "The profile update failed due to a network error.", error, false, false);
    }
}