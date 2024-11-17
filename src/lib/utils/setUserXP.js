import { updateExperience } from "$lib/logic/userAPI";

export async function setUserXP(newExp, earnedExp, secondAttempt) {
    let state;

    try {
        state = await updateExperience(localStorage.getItem("bearer"), localStorage.getItem("id"), newExp, "index", secondAttempt);
        if (state == "retry" && earnedExp != 0) {
            reattemptExperienceUpdate(earnedExp);
        }
    } catch (error) {
        console.error("Error setting User XP in accountLogic.js: " + error);
    }
}

async function reattemptExperienceUpdate(earnedExp) {
    try {
        console.warn("Re-attempting XP set due to error 400 (local save behind)")
        await checkSigninStatusAndLoadUserInfo(); // load new player details again
        setUserXP(Number(localStorage.getItem("experience")) + earnedExp, 0, true);
    } catch (error) {
        console.error("Re-attempting the XP update failed: " + error);
    }
}