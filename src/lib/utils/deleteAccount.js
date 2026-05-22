import { profilePopup } from "$lib/stores/uiStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { signOut } from "$lib/logic/accountLogic";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { get } from "svelte/store";

export async function submitAccountDeletion(password) {
    let successState = await deleteUser(password);
    // If success, continue (errors are caught and displayed in deleteUser)
    if (successState) {
        signOut();

        setTimeout(() => {
            profilePopup.set(false); // Close profile popup
            errorPopup("Account deleted", "You have deleted your OpenGuessr account.", "Successfully deleted.", false, true);
        }, 250);
    }
}

async function deleteUser(password) {
    try {
        const response = await fetch(`${get(apiUrl)}/accounts/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                password
            })
        });

        // Check if the response is successful
        if (response.ok) {
            await response.json();
            return true;

        } else {
            let responseError = response.status;
            try {
                const data = await response.json();
                if (data.error) responseError = data.error;
            } catch { }
            throw new Error(responseError);
        }

    } catch (error) {
        console.error("Faled to delete account:", error);
        errorPopup("Failed to delete account", "An error occured trying to delete the account.", error.message);
        return false;
    }
}