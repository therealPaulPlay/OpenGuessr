import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileExperience, profileId, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
import { getProfileData } from "$lib/utils/getProfileData";

export async function loadProfileFromId(id, view) {
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
    }

    // Show profile Popup
    if (view && data) profilePopup.set(true);

    return true;
}