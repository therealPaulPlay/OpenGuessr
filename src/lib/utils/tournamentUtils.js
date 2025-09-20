import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { tournamentData } from "$lib/stores/context-specific/tournamentStore";
import { get } from "svelte/store";

export function fetchTournaments() {
    try {
        const response = await fetch(`${get(apiUrl)}/tournaments/all-tournaments${localStorage.getItem("id") ? `?=user-id${localStorage.getItem("id")}` : ""})}`);

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();
            tournamentData.set(data);

        } else {
            throw new Error(response.status);
        }
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        return error;
    }
}