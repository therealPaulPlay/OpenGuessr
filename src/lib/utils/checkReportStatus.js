import { isAuthenticated, checkedForWarning, warnReportEntryData } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

export async function fetchWarnlistStatus() {
    if (!get(isAuthenticated) || get(checkedForWarning)) return;

    try {
        const response = await fetch(get(apiUrl) + "/accounts/check-warnlist/" + localStorage.getItem("id"));

        if (response.ok) {
            const data = await response.json();
            warnReportEntryData.set(data?.entry);
            checkedForWarning.set(true);
        } else {
            console.error("Error checking warnlist status: " + response.status);
        }
    } catch (error) {
        console.error("Error occurred while checking banlist status:", error);
    }
}