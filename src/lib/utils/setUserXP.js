import { updateExperience } from "$lib/logic/userAPI";

export async function setUserXP(newExp) {
    try {
        await updateExperience(localStorage.getItem("bearer"), localStorage.getItem("id"), newExp, "index");
    } catch (error) {
        console.error("Error setting User XP in accountLogic.js: " + error);
    }
}