import { isAuthenticated } from "$lib/stores/accountStore";
import { get } from "svelte/store";

export async function checkIfFriendsWithId(id) {
    if (get(isAuthenticated)) {
        try {
            const requestBody = {
                id: localStorage.getItem("id"),
            };

            const response = await fetch("https://friends.openguessr.com/friends/friends", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("bearer"),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const data = await response.json();
                const isFriend = data?.friends.some((friend) => friend?.id === id);

                return isFriend; // Return true if the friend is found, otherwise false
            } else {
                console.error("Error loading friends to check friendship state: " + response.status);
                return false;
            }
        } catch (error) {
            console.error("Fetch/Network error occurred while loading friends: ", error);
            return false;
        }
    } else {
        return false;
    }
}