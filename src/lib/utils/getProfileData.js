import { isAuthenticated } from "$lib/stores/accountStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { showErrorPopup } from "openguessr-ui";
import { get } from "svelte/store";

export async function getProfileData(id) {

    try {
        const response = await fetch(get(apiUrl) + `/accounts/profile/${id}${get(isAuthenticated) && id !== localStorage.getItem("id") ? `?id=${localStorage.getItem("id")}` : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else throw new Error(response.status);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showErrorPopup("Error loading profile", "Couldn't load the user's profile.", error.message);
    }
}