import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileId } from "$lib/stores/context-specific/profileStore";
import { getProfileData } from "$lib/utils/getProfileData";
import { showConfirmPopup } from "./confirmPopup";
import { checkAuthenticationStatus, resetLocalSave } from "$lib/logic/accountLogic";
import { signupPrompt } from "./signupPrompt";

export async function showProfile(userId) {
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
            resetLocalSave();
            checkAuthenticationStatus();
            signupPrompt();
        });
    }

    // Show profile Popup
    if (data) profilePopup.set(true);
}