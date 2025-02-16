import { errorPopup } from "./errorHandling";

let lastPublicRoomCode = "";

export async function addPublicRoom(code, playerCount = 0, map = "default") {
    lastPublicRoomCode = code;

    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/open-room/" + code, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ` + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                playerCount,
                map,
            }),
        });

        if (!response.ok) throw new Error("Server responded with " + response?.status);
    } catch (error) {
        console.error("Error occured adding public room: ", error);
        errorPopup("Error adding public room", "An error occured trying to submit the public room to the server.", error);
    }
}

export async function deletePublicRoom() {
    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/open-room/" + lastPublicRoomCode, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ` + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({
                id: localStorage.getItem("id")
            }),
        });

        if (!response.ok && response?.status !== 404) throw new Error("Server responded with " + response?.status);
    } catch (error) {
        console.warn("Error occured deleting public room: ", error);
    }
}

export async function fetchPublicRooms() {
    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/list-open-rooms");

        if (response.ok) {
            const data = await response.json();
            return data || [];
        } else {
            console.error("Failed to load public rooms: " + response.status);
        }
    } catch (error) {
        console.error("Failed ro load public rooms (Network): ", error);
    }
}