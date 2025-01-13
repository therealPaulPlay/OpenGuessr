import { checkedForBan, isAuthenticated, banReportEntryData, isBanned, checkedForWarning, warnReportEntryData, isWarned } from "$lib/stores/accountStore";
import { get } from "svelte/store";

export async function fetchBlacklistStatus() {
    if (!get(isAuthenticated) || get(checkedForBan)) return;

    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/check-blacklist/" + localStorage.getItem("id"));

        if (response.ok) {
            const data = await response.json();
            isBanned.set(data.listed);
            banReportEntryData.set(data?.entry);
            checkedForBan.set(true);
        } else {
            console.error("Error checking banlist status: " + response.status);
        }
    } catch (error) {
        console.error("Error occurred while checking banlist status:", error);
    }
}

export async function fetchWarnlistStatus() {
    if (!get(isAuthenticated) || get(checkedForBan)) return;

    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/check-warnlist/" + localStorage.getItem("id"));

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