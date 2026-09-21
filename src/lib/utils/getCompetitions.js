import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
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
                return { errorMessages: ["Failed to parse successful competition response."] };
            }
        } else {
            let responseData = null;

            try {
                responseData = await response.json();

                let errorMessages = [];

                if (responseData.error) errorMessages.push(responseData.error);
                if (responseData.message) errorMessages.push(responseData.message);

                if (responseData.errors && Array.isArray(responseData.errors)) {
                    responseData.errors.forEach((err) => {
                        if (err.msg) errorMessages.push(err.msg);
                        else errorMessages.push(JSON.stringify(err));
                    });
                }

                return { errorMessages };
            } catch {
                return { errorMessages: ["Request failed with status " + response.status + "."] };
            }
        }
    } catch (error) {
        console.error("Error occurred during competition load: ", error);
        return { errorMessages: ["A network error has occurred."] };
    }
}