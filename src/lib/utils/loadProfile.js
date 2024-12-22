import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileName, profileExperience, joinedDate, profileId, profileElo, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
import { getProfileData } from "$lib/utils/getProfileData";

export async function loadProfileFromId(id, view) {
    // Reset data
    profileData.set();
    profileName.set("Guest");
    profileExperience.set(0);
    joinedDate.set(0);
    profileSupporterLevel.set(0);
    profileId.set(-1);
    profileElo.set(1000);

    const data = await getProfileData(id);

    // Save data
    if (data) {
        profileData.set(data.profileData);
        profileName.set(data.username);
        profileExperience.set(data.experience);
        joinedDate.set(data.joinedDate);
        profileElo.set(data.elo);
        profileSupporterLevel.set(data.supporterLevel);
        profileId.set(id);
    }

    // Show profile Popup
    if (view && data) {
        profilePopup.set(true);
    }

    return true;
}