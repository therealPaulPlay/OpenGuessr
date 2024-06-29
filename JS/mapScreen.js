document.getElementById("backButton").addEventListener("click", function () { window.location.href = "/index.html" });

//This will have to be replaced by an API call in the future TODO -----------------------------------------------------
async function loadCommunityMaps() {
    try {
        const response = await fetch("https://maps.openguessr.com/maps");
        const data = await response.json();

        if (response.ok) {
            data.communityMaps.forEach(map => {
                addMap(map.name, map.author, map.favourite, map.author, map.description);
            });

            // Initialize search functionality
            initializeSearch(data.communityMaps);
        } else {
            console.error("Error loading community maps: " + response.status);
            document.getElementById("errorMessage").textContent = "Error: " + response.status;
        }

    } catch (error) {
        console.error("Error loading community maps: " + error);
        document.getElementById("errorMessage").textContent = "Error: " + error;
    }
}

//Load the map elements one by one ----------------------------------------------------------------------
function addMap(name, creator, fav, author, description) {
    let container = fav ? "featured-map" : "community-maps";

    let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

    if (document.getElementById("errorMessage")) {
        document.getElementById("errorMessage").remove();
    }

    const mapItem = document.createElement("div");
    mapItem.classList.add("map-item");
    if (fav) {
        mapItem.classList.add("ourFavourites");
    } else {
        mapItem.classList.add("searchableMap");
    }

    mapItem.dataset.name = name.toLowerCase();
    mapItem.dataset.author = creator.toLowerCase();

    mapItem.addEventListener("click", () => {
        instantPlayPopup(name);
    });

    const mapInfo = document.createElement("div");
    mapInfo.classList.add("map-info");

    const mapName = document.createElement("div");
    mapName.classList.add("map-name");
    mapName.textContent = name;

    const mapAuthor = document.createElement("div");
    mapAuthor.classList.add("map-author");
    mapAuthor.textContent = `by ${creator}`;

    mapInfo.appendChild(mapName);
    mapInfo.appendChild(mapAuthor);

    const descArea = document.createElement("div");
    descArea.classList.add("map-desc");
    const descIcon = document.createElement("span");
    descIcon.textContent = "About";
    descArea.addEventListener("click", (event) => {
        event.stopPropagation();
        showDescriptionWindow(name, author, description);
    });

    const addButton = document.createElement("button");
    addButton.classList.add("add-button");
    if (fav) {
        addButton.classList.add("fav-add-button");
    }

    if (mapArray.includes(name)) {
        addButton.innerHTML = `<img src="./IMG/heart_icon.png" alt="add map" class="heart-icon">`;
    } else {
        addButton.innerHTML = `<img src="./IMG/no_heart_icon.png" alt="add map" class="heart-icon">`;
    }

    addButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (addButton.innerHTML == `<img src="./IMG/no_heart_icon.png" alt="add map" class="heart-icon">`) {
            addSelectedMap(name);
            addButton.innerHTML = `<img src="./IMG/heart_icon.png" alt="add map" class="heart-icon">`;
        } else {
            removeSelectedMap(name);
            addButton.innerHTML = `<img src="./IMG/no_heart_icon.png" alt="add map" class="heart-icon">`;
        }
    });

    descArea.appendChild(descIcon);

    mapItem.appendChild(mapInfo);
    mapItem.appendChild(descArea);
    mapItem.appendChild(addButton);

    document.getElementById(container).appendChild(mapItem);
}

function addSelectedMap(name) {
    try {
        let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
        if (!mapArray.includes(name)) {
            mapArray.push(name);
            localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
        }
    } catch (error) {
        console.error("Error adding community map: " + error);
    }
}

function removeSelectedMap(name) {
    try {
        let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
        const index = mapArray.indexOf(name);
        if (index !== -1) {
            mapArray.splice(index, 1);
            localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
        }
    } catch (error) {
        console.error("Error removing community map: " + error);
    }
}

function showDescriptionWindow(title, author, desc) {
    document.getElementById("descriptionPopup").style.display = "flex";
    document.getElementById("descHeader").textContent = title;
    document.getElementById("descAuthor").textContent = "by " + author;
    document.getElementById("descText").textContent = desc;
}

document.getElementById("descClose").addEventListener("click", () => {
    document.getElementById("descriptionPopup").style.display = "none";
});

function instantPlayPopup(mapName) {
    document.getElementById("instantPlayPopup").style.display = "flex";
    document.getElementById("instantPlayHeader").textContent = "Play " + mapName + "?";

    document.getElementById("instantPlayConfirm").addEventListener("click", () => {
        localStorage.setItem("selectedCategory", "community_" + mapName.toLowerCase());
        /* category variable names are always lowercase and have community_ in front of them, if they are community maps */
        addSelectedMap(mapName);
        window.location.href = "/";
    });
}

document.getElementById("instantPlayClose").addEventListener("click", () => {
    document.getElementById("instantPlayPopup").style.display = "none";
});

// prevent enter to reload default action in search bar
document.getElementById("mapSearch").addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });


// Initialize search functionality
function initializeSearch(maps) {
    const searchInput = document.getElementById("mapSearch");
    const nothingFound = document.getElementById("nothingFound");

    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();
        let hasVisibleMaps = false;

        document.querySelectorAll(".searchableMap").forEach(map => {
            const mapName = map.dataset.name;
            const mapAuthor = map.dataset.author;
            if (mapName.includes(query) || mapAuthor.includes(query)) {
                map.style.display = "";
                hasVisibleMaps = true;
            } else {
                map.style.display = "none";
            }
        });

        if (hasVisibleMaps) {
            nothingFound.style.display = "none";
        } else {
            nothingFound.style.display = "block";
        }
    });
}

// Load all community maps on page load
loadCommunityMaps();

// Map uploading --------------------------------------------------------------------------------------------------------------------------------

document.getElementById("uploadButton").addEventListener("click", () => {
    if (localStorage.getItem("username") != null && localStorage.getItem("id") != null) {
        openUploadPopup();
    } else {
        window.location.href = "/signup.html";
    }
});

document.getElementById("uploadConfirm").addEventListener("click", () => {
    document.getElementById("uploadConfirmHeader").textContent = "Are you sure?";
    document.getElementById("uploadConfirmText").textContent = "Submitted maps cannot be edited or deleted! Violating the rules can result in a permanent ban.";
    document.getElementById("uploadConfirmClose").style.display = "block";
    document.getElementById("uploadConfirmFinal").style.display = "block";
    // now show the window
    document.getElementById("uploadConfirmPopup").style.display = "flex";
});


function openUploadPopup() {
    document.getElementById("uploadPopup").style.display = "flex";
    document.getElementById("uploadWindow").scrollTop = "0";
    document.getElementById("uploadPopup").scrollTop = "0";
}

document.getElementById("uploadClose").addEventListener("click", () => {
    document.getElementById("uploadPopup").style.display = "none";
});

let mapSubmittedSuccessfully = false;

document.getElementById("uploadConfirmClose").addEventListener("click", () => {
    document.getElementById("uploadConfirmPopup").style.display = "none";
    if (mapSubmittedSuccessfully) {
        window.location.reload();
    }
});

document.getElementById("uploadConfirmFinal").addEventListener("click", () => {
    document.getElementById("uploadConfirmClose").style.display = "block";
    document.getElementById("uploadConfirmFinal").style.display = "none";
    document.getElementById("uploadConfirmHeader").textContent = "Submitting map...";
    document.getElementById("uploadConfirmText").textContent = "Waiting for status...";
    uploadMap();
});

async function uploadMap() {
    // if successful, close underlying menu
    let operationMessage = await submitMap();
    document.getElementById("uploadConfirmText").textContent = operationMessage;
    if (operationMessage.includes("success")) {
        document.getElementById("uploadConfirmHeader").textContent = "Map submitted!";
    } else {
        document.getElementById("uploadConfirmHeader").textContent = "Oh no! An error occured";
    }
}

async function submitMap() {
    // Retrieve input values
    const name = document.getElementById('uploadMapName').value;
    const description = document.getElementById('uploadMapDescription').value;
    const mapData = document.getElementById('uploadMapData').value;
    const author = localStorage.getItem('username');
    const player_id = localStorage.getItem('id');

    // Validate inputs
    if (!name || !description || !mapData || !author || !player_id) {
        return 'All fields are required.';
    }

    // Construct the payload
    let payload;
    try {
        payload = {
            player_id,
            name,
            author,
            description,
            mapData: extractCoordinates(mapData) // assuming mapData is a JSON string
        };
    } catch (error) {
        console.error("Error creating payload and extracting coordinates: " + error);
        return "Your list of streetview links could not be converted to coordinates.";
    }

    try {
        // Send POST request to the server
        const response = await fetch('https://maps.openguessr.com/maps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Parse the response
        const result = await response.json();

        // Return the success or error message
        if (response.ok) {
            document.getElementById("uploadPopup").style.display = "none";
            mapSubmittedSuccessfully = true;
            return "Map submitted successfully! Thank you so much for contributing.";
        } else {
            let resultErrors = "";
            try {
                result.errors.forEach((e) => {
                    resultErrors += e.msg;
                    resultErrors += " ";
                });
            } catch (e) {}
            resultErrors += result.error;
            console.error("Errors occured during map submission on the server: " + resultErrors);
            return resultErrors || "Failed to submit map.";
        }
    } catch (error) {
        console.error('Error submitting map:', error);
        return "A network error occurred while submitting the map. Please try again.";
    }
}


// Convert streetview links to json file:
function extractCoordinates(text) {
    try {
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/g;
        const coordinates = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const long = parseFloat(match[2]);
            coordinates.push([lat, long]);
        }

        // Wrap coordinates with the outer object
        const output = JSON.stringify({ locations: coordinates }, null, 2);

        return output;
    } catch (error) {
        console.error("Error in extractCoordinates: " + error);
    }
}

