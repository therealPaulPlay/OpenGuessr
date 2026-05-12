import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileId } from "$lib/stores/context-specific/profileStore";
import { getProfileData } from "$lib/utils/getProfileData";
import { showConfirmPopup } from "./confirmPopup";
import { signOut } from "$lib/logic/accountLogic";
import { signupPrompt } from "./signupPrompt";
import { get } from "svelte/store";

export async function showProfile(userId) {
    // If already open, play close -> open animation again to avoid jarring data switch
    if (get(profilePopup)) profilePopup.set(false);
    
    // Reset data
    profileData.set();
    profileId.set(-1);

    const data = await getProfileData(userId);

    // Save data
    if (data) {
        profileData.set(data);
        profileId.set(userId);
    } else if (userId == localStorage.getItem("id")) {
        showConfirmPopup("Sign out?", "Loading your profile failed. If this was due to an authentication issue, signing out and back in might help.", () => {
            signOut();
            signupPrompt();
        });
    }

    // Show profile Popup
    if (data) profilePopup.set(true);
}