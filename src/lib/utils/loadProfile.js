import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileExperience, profileId, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
import { getProfileData } from "$lib/utils/getProfileData";
import { showConfirmPopup } from "./confirmPopup";
import { checkAuthenticationStatus, resetLocalSave } from "$lib/logic/accountLogic";
import { signupPrompt } from "./signupPrompt";

export async function loadProfileFromId(id) {
    // Reset data
    profileData.set();
    profileExperience.set(0);
    profileSupporterLevel.set(0);
    profileId.set(-1);

    const data = await getProfileData(id);

    // Save data
    if (data) {
        profileData.set(data);
        profileExperience.set(data.experience);
        profileSupporterLevel.set(data.supporterLevel);
        profileId.set(id);
    } else if (id == localStorage.getItem("id")) {
        showConfirmPopup("Sign out?", "Loading your profile failed. If this was due to an authentication issue, signing out and back in might help.", () => {
            resetLocalSave();
            checkAuthenticationStatus();
            signupPrompt();
        });
    }

    // Show profile Popup
    if (data) profilePopup.set(true);

    return true;
}