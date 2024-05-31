document.getElementById("backButton").addEventListener("click", function () { window.location.href = "/index.html" });

document.getElementById("uploadButton").addEventListener("click", () => {
    // Logic to open upload window or modal
    alert("Upload window opened");
});

function addMap(containerId, name, creator, fav) {
    let mapArray = localStorage.getItem("addedCommunityMaps");
    if (!mapArray) {
        mapArray = [];
    }

    if (document.getElementById("errorMessage")) {
        document.getElementById("errorMessage").remove();
    }

    const mapItem = document.createElement("div");
    mapItem.classList.add("map-item");
    if (fav) {
        mapItem.classList.add("ourFavourites")
    }

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

    const mapStars = document.createElement("div");
    mapStars.classList.add("map-desc");
    const descIcon = document.createElement("span");
    descIcon.textContent = "Info";
    descIcon.addEventListener("click", () => {
        // Logic to handle starring the map
        alert(`Description for: ${name}`);
    });

    const addButton = document.createElement("button");
    addButton.classList.add("add-button");
    if (fav) {
        addButton.classList.add("fav-add-button");
    }

    if (mapArray.includes(name)) {
        addButton.textContent = "-";
        addButton.classList.add("map-added");
    } else {
        addButton.textContent = "+";
    }

    addButton.addEventListener("click", () => {
        // Logic to handle starring the map
        if (addButton.textContent == "+") {
            addSelectedMap(name);
            addButton.textContent = "-";
            addButton.classList.add("map-added");
        } else {
            removeSelectedMap(name);
            addButton.textContent = "+";
            addButton.classList.remove("map-added");
        }
    });

    mapStars.appendChild(descIcon);

    mapItem.appendChild(mapInfo);
    mapItem.appendChild(mapStars);
    mapItem.appendChild(addButton);

    document.getElementById(containerId).appendChild(mapItem);
}

// Example of adding featured maps
addMap("featured-map", "Beautiful Scenery", "User123", true);
addMap("featured-map", "Historical Sites", "User456", true);

// Example of adding community maps
addMap("community-maps", "City Lights", "User789", false);
addMap("community-maps", "Mountain Trails", "User321", false);
addMap("community-maps", "Ocean Views", "User654", false);


//selected maps are being stored in localstorage and use an array as the format ["mapName", "mapName2"..]
function addSelectedMap(name) {
    try {
        let mapArray = [];
        const tempArrayfromStorage = JSON.parse(localStorage.getItem("addedCommunityMaps"));
        if (Array.isArray(tempArrayfromStorage)) {
            mapArray = tempArrayfromStorage;
        }
        mapArray.push(name);
        localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
    } catch (error) {
        console.error("Error adding community map in mapScreen.js: " + error);
    }
}

function removeSelectedMap(name) {
    try {
        let mapArray = [];
        const tempArrayfromStorage = JSON.parse(localStorage.getItem("addedCommunityMaps"));
        if (Array.isArray(tempArrayfromStorage)) {
            mapArray = tempArrayfromStorage;
        }
        const index = mapArray.indexOf(name);
        if (index !== -1) {
            mapArray.splice(index, 1);
        }
        localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
    } catch (error) {
        console.error("Error removing community map in mapScreen.js: " + error);
    }
}
