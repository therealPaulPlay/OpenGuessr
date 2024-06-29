document.getElementById("backButton").addEventListener("click", function () { window.location.href = "/index.html" });

document.getElementById("uploadButton").addEventListener("click", () => {
    // Logic to open upload window or modal
    alert("Upload window opened");
});

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
document.getElementById("mapSearch").addEventListener("keydown", function(event) { if (event.key === "Enter") event.preventDefault(); });


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
