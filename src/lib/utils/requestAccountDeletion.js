import { showConfirmPopup, showErrorPopup } from "openguessr-ui";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { get } from "svelte/store";

export async function requestAccountDeletion() {
    try {
        const response = await fetch(`${get(apiUrl)}/accounts/request-deletion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`,
            },
            body: JSON.stringify({
                id: localStorage.getItem("id")
            })
        });

        // Check if the response is successful
        if (response.ok) showConfirmPopup("Email sent", "A link to confirm the deletion was sent to your account's email address.");
        else {
            let responseError = response.status;
            try {
                const data = await response.json();
                if (data.error) responseError = data.error;
            } catch { }
            throw new Error(responseError);
        }

    } catch (error) {
        console.error("Failed to request account deletion:", error);
        showErrorPopup("Failed to request account deletion", "An error occurred trying to send the confirmation email.", error.message);
    }
}