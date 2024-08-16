import { loadProfileFromId } from "./profileView";
import { playSound } from "./soundManager";

// Friend browser ---------------------------------------------------------------------------------------
const container = document.getElementById("playerSearchBox");
let addFriendsButton = document.getElementById("browseUsersFriends");

addFriendsButton.addEventListener("click", () => {
    playSound("basic_button");
    container.innerHTML =  `<p class="playerSearchError">Input a query.</p>`;
    document.getElementById("friendBrowserPopup").style.display = "flex";
});

document.getElementById("friendBrowserClose").addEventListener("click", () => {
    playSound("basic_button");
    document.getElementById("friendBrowserPopup").style.display = "none";
});

document.getElementById("friendBrowserInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
    };
});

document.getElementById("friendBrowserInput").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        startSearch();
    };
});

document.getElementById("startFriendSearch").addEventListener("click", startSearch);

async function startSearch() {
    container.innerHTML = `<p class="playerSearchError">Searching...</p>`;

    try {
        const query = document.getElementById("friendBrowserInput").value;

        if (!query) {
            container.innerHTML = `<p class="playerSearchError">Query cannot be empty.</p>`;
            return;
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/search/" + query, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            try {
                const data = await response.json();

                let idCounter = 0;

                container.innerHTML = "";

                data.users.forEach(entry => {
                    idCounter++;

                    let newEntry = document.createElement("div");
                    newEntry.classList.add("friendSearchItem");

                    if (entry.supporter_level && entry.supporter_level > 0) {
                        newEntry.classList.add("leaderboardSupporterEntry");
                    }

                    newEntry.innerHTML = `
                    <p>${entry.user_name}</p>
                    <button id="sendFriendRequest${idCounter}" class="sendFriendRequestBrowser standardButton">
                        Send request +
                    </button>`;

                    if (entry.id == localStorage.getItem("id")) {
                        newEntry.classList.add("friendSearchYou");
                    }

                    newEntry.id = "friendSearchEntry" + idCounter;

                    container.appendChild(newEntry);

                    document.getElementById("friendSearchEntry" + idCounter).addEventListener("click", () => {
                        loadProfileFromId(entry.id, false, true);
                    });
                });

                if (!container.innerHTML) {
                    container.innerHTML = `<p class="playerSearchError">No results.</p>`;
                }

            } catch (error) {
                console.error("In-Code error loading user browser: " + error);
            }

        } else {
            console.error("Error loading the user browser: " + response.status);
            container.innerHTML = `<p class="playerSearchError">Error: ${response.status}</p>`;
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading user browser results: ', error);
        container.innerHTML = `<p class="playerSearchError">Network error: ${error}</p>`;
    }
}