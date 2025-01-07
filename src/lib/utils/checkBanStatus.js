import { checkedForBan, isAuthenticated, reportEntryData, isBanned } from "$lib/stores/accountStore";
import { get } from "svelte/store";

export async function fetchBlacklistStatus() {
    if (!get(isAuthenticated) || get(checkedForBan)) return;

    try {
        const response = await fetch(
            "https://accounts.openguessr.com/accounts/check-blacklist/" + localStorage.getItem("id"),
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("bearer"),
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            const data = await response.json();
            isBanned.set(data.blacklisted);
            reportEntryData.set(data?.entry);
            checkedForBan.set(true);
        } else {
            console.error("Error accepting / deleting the friend request: " + response.status);
        }
    } catch (error) {
        console.error("Error occurred while checking banlist status:", error);
    }
}