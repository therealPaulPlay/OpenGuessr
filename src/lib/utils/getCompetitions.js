import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { dailyStreakDays } from "$lib/stores/context-specific/competitionStore";
import { get } from "svelte/store";

const competitionsEndpoint = get(apiUrl) + "/competitions";

export async function getCompetitions({ expired = false, search = "", daily = false, filterEntered = false, index = 0 } = {}) {
    try {
        // Endpoint selection
        let endpoint = null;

        if (!expired) endpoint = competitionsEndpoint + "/" + index;
        if (expired) endpoint = competitionsEndpoint + "/expired/" + index;
        if (search) endpoint = competitionsEndpoint + "/search/" + index;
        if (daily) endpoint = competitionsEndpoint + "/daily/daily-competition";
        if (filterEntered) endpoint = competitionsEndpoint + "/not-entered/" + index;

        // Build query params
        const params = new URLSearchParams();
        const userId = localStorage.getItem("id");
        if (userId) params.set("id", userId);
        if (search) params.set("search", search);
        if (params.size > 0) endpoint += "?" + params.toString();

        // Build headers
        const headers = {};
        if (filterEntered) headers["Authorization"] = "Bearer " + localStorage.getItem("bearer");

        const response = await fetch(endpoint, {
            method: "GET",
            headers,
        });

        if (response.ok) {
            try {
                const data = await response.json();
                return { competitions: data.competitions, streakDays: data.streakDays, streak: data.streak };
            } catch (error) {
                console.error("Error parsing successful competition response:", error);
                return { error: "Failed to parse successful response." };
            }
        } else {
            let responseData = null;

            try {
                responseData = await response.json();
                return { error: responseData.error };
            } catch {
                return { error: "Request failed with status " + response.status + "." };
            }
        }
    } catch (error) {
        console.error("Error occurred during competition load:", error);
        return { error: "A network error has occurred." };
    }
}

export async function loadStreakDays() {
    try {
        const { error, streakDays } = await getCompetitions({ daily: true });
        if (error) throw new Error(error);

        dailyStreakDays.set(streakDays ?? []);
    } catch (error) {
        console.error("Error occurred during streak load: ", error);
    }
}