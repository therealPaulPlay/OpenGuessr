import { checkedForBan, isAuthenticated, banReportEntryData, isBanned, checkedForWarning, warnReportEntryData, isWarned } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { errorPopup } from "./errorHandling";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

export async function fetchBlacklistStatus() {
    if (!get(isAuthenticated) || get(checkedForBan)) return;

    try {
        const response = await fetch(get(accountUrl) + "/accounts/check-blacklist/" + localStorage.getItem("id"));

        if (response.ok) {
            const data = await response.json();
            isBanned.set(data.listed);
            banReportEntryData.set(data?.entry);
            checkedForBan.set(true);
        } else {
            console.error("Blacklist endpoint returned response error: " + response.status);
            checkedForBan.set(true); // Still allow to play - a non-200 status is likely related to a backend error
        }
    } catch (error) {
        console.error("Error occurred while checking banlist status:", error);
        errorPopup("Failed to check blacklist status", "The blacklist status could not be fetched.", error);
    }
}

export async function fetchWarnlistStatus() {
    if (!get(isAuthenticated) || get(checkedForBan)) return;

    try {
        const response = await fetch(get(accountUrl) + "/accounts/check-warnlist/" + localStorage.getItem("id"));

        if (response.ok) {
            const data = await response.json();
            isWarned.set(data.listed);
            warnReportEntryData.set(data?.entry);
            checkedForWarning.set(true);
        } else {
            console.error("Error checking warnlist status: " + response.status);
        }
    } catch (error) {
        console.error("Error occurred while checking banlist status:", error);
    }
}