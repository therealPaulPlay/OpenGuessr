document.getElementById("backButton").addEventListener("click", function () { window.location.href = "/index.html" });

document.getElementById("uploadButton").addEventListener("click", () => {
    // Logic to open upload window or modal
    alert("Upload window opened");
});

function addMap(containerId, name, creator, fav) {
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
    addButton.textContent = "+";
    addButton.addEventListener("click", () => {
        // Logic to handle starring the map
        alert(`You starred the map: ${name}`);
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