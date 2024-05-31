document.getElementById("backButton").addEventListener("click", function () { window.location.href = "/index.html" });

document.getElementById("uploadButton").addEventListener("click", () => {
    // Logic to open upload window or modal
    alert("Upload window opened");
});

//This will have to be replaced by an API call in the future TODO -----------------------------------------------------
async function loadCommunityMaps() {
    try {
        const response = await fetch("./JSON/communityMapMetadata.json");
        const data = await response.json();

        data.communityMaps.forEach(map => {
            addMap(map.name, map.author, map.favourite, map.description);
        });
    } catch (error) {
        console.error("Error loading community maps: " + error);
    }
}

//Load the map elements one by one ----------------------------------------------------------------------
function addMap(name, creator, fav, description) {
    let container = fav ? "featured-map" : "community-maps";

    let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

    if (document.getElementById("errorMessage")) {
        document.getElementById("errorMessage").remove();
    }

    const mapItem = document.createElement("div");
    mapItem.classList.add("map-item");
    if (fav) {
        mapItem.classList.add("ourFavourites");
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

    const descArea = document.createElement("div");
    descArea.classList.add("map-desc");
    const descIcon = document.createElement("span");
    descIcon.textContent = "Info";
    descArea.addEventListener("click", () => {
        showDescriptionWindow(name, description);
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

function showDescriptionWindow(title, desc) {
    document.getElementById("descriptionPopup").style.display = "flex";
    document.getElementById("descHeader").textContent = title;
    document.getElementById("descText").textContent = desc;
}

document.getElementById("descClose").addEventListener("click", () => {
    document.getElementById("descriptionPopup").style.display = "none";
});

// Load community maps on page load
loadCommunityMaps();
