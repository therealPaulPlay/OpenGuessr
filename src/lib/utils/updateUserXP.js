import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { experience } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { errorPopup } from "./errorHandling";

export async function addUserXP(addExperience) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            experience: addExperience
        };

        // Make the PUT request using Fetch API
        const response = await fetch(`${get(apiUrl)}/accounts/update/add-experience`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`
            },
            body: JSON.stringify(requestBody)
        });

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();
            experience.set(data?.user?.experience);
        } else {
            let data;
            try {
                data = await response.json();
            } catch { }
            throw new Error(data?.error || response.status);
        }
    } catch (error) {
        console.error('Error occurred updating user experience: ', error);
        errorPopup("Experience update failed", "Failed to update the user's experience.", error);
    }
}