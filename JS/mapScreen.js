// Back button and iframe communication + check ---------------------------------------------------
function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

document.getElementById("backButton").addEventListener("click", function () {
    if (inIframe()) {
        window.top.postMessage("close", "*");
        window.top.postMessage("reloadCommunityMaps", "*");
        window.top.postMessage("loadCategory", "*");
    } else {
        window.location.href = "/index.html";
    }
});

function openProfile(id) {
    if (inIframe()) {
        window.top.postMessage("profile" + id, "*");
    } else {
        window.location.href = "/index.html?profile=" + id;
    }
}

// Load community maps using the openguessr map api  -----------------------------------------------------
let currentFetchIndex = 0;
let lastSearchMode = "index";

let loadMoreCategoryParam = undefined;
let loadMoreQueryParam = undefined;

let initial

async function loadCommunityMaps(index, category, query, fav) {
    try {
        document.getElementById("loadMore").style.display = "none";
        loadMoreCategoryParam = category;
        loadMoreQueryParam = query;

        // this if block resets the index to 0 if a new loading method is being used
        if (index == 0 || index == undefined) {
            document.getElementById("community-maps").innerHTML = "";
        }

        document.getElementById("nothingFound").style.display = "none";

        let indexAdd = index != undefined ? "index/" + index : "";
        const categoryAdd = category ? "category/" + category : "";
        const queryAdd = query ? "search/" + query : "";
        const favAdd = fav ? "favourites" : "";

        if (category || query) {
            indexAdd = "/" + index;
        }

        const response = await fetch("https://maps.openguessr.com/maps/" + categoryAdd + queryAdd + indexAdd + favAdd);
        const data = await response.json();

        if (response.ok) {

            if (index != undefined) {
                currentFetchIndex = index;
            }

            if (data.communityMaps.length == 50 && !fav) {
                document.getElementById("loadMore").style.display = "block";
            }

            let nothingFound = true;

            data.communityMaps.forEach(map => {
                // fav maps are only being added if fav is defined/true
                if (!map.favourite || fav) {
                    addMap(map.name, map.author, map.authorId, map.favourite, map.author, map.description, map.category);
                    nothingFound = false;
                }
            });

            if (nothingFound && !fav) {
                document.getElementById("nothingFound").style.display = "block";
            }
        } else {
            console.error("Error loading community maps: " + response.status);
            document.getElementById("errorMessage").style.display = "block";
            document.getElementById("errorMessage").textContent = "Error: " + response.status;
        }

    } catch (error) {
        console.error("Error loading community maps: " + error);
        document.getElementById("errorMessage").style.display = "block";
        document.getElementById("errorMessage").textContent = "Error: " + error;
    }
}

// Load the map elements one by one ----------------------------------------------------------------------
function addMap(name, creator, creatorId, fav, author, description) {
    let container = fav ? "featured-map" : "community-maps";

    let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

    if (document.getElementById("errorMessage")) {
        document.getElementById("errorMessage").style.display = "none";
    }

    const mapItem = document.createElement("div");
    mapItem.classList.add("map-item");
    if (fav) {
        mapItem.classList.add("ourFavourites");
    } else {
        mapItem.classList.add("searchableMap");
    }

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

    let owned = false;

    if (creatorId == localStorage.getItem("id") && localStorage.getItem("id") && !fav) { // favorite (spotlight) maps should not be deletable
        descArea.classList.add("map-desc-owned");
        owned = true;
    }

    const descIcon = document.createElement("span");
    descIcon.textContent = "About";
    if (localStorage.getItem("id") == creatorId && localStorage.getItem("id") && !fav) {
        descIcon.textContent = "Manage";
    }
    descArea.addEventListener("click", (event) => {
        event.stopPropagation();
        showDescriptionWindow(name, author, description, owned, creatorId);
    });

    const addButton = document.createElement("button");
    addButton.classList.add("add-button");
    if (fav) {
        addButton.classList.add("fav-add-button");
    }

    if (mapArray.includes(name)) {
        addButton.innerHTML = `<img src="./IMG/disselect_icon.png" alt="add map" class="heart-icon">`;
    } else {
        addButton.innerHTML = `<img src="./IMG/select_icon.png" alt="add map" class="heart-icon">`;
    }

    addButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (addButton.innerHTML == `<img src="./IMG/select_icon.png" alt="add map" class="heart-icon">`) {
            addSelectedMap(name);
            addButton.innerHTML = `<img src="./IMG/disselect_icon.png" alt="add map" class="heart-icon">`;
        } else {
            removeSelectedMap(name);
            addButton.innerHTML = `<img src="./IMG/select_icon.png" alt="add map" class="heart-icon">`;
        }
    });

    descArea.appendChild(descIcon);

    mapItem.appendChild(mapInfo);
    mapItem.appendChild(descArea);
    mapItem.appendChild(addButton);

    document.getElementById(container).appendChild(mapItem);
    setTimeout(() => {
        mapItem.style.opacity = "1";
    }, 10);
}

// Like / Dislike
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

function showDescriptionWindow(name, author, desc, isAuthor, authorId) {
    document.getElementById("descriptionPopup").style.display = "flex";
    document.getElementById("descHeader").textContent = name;
    document.getElementById("descText").textContent = desc;
    document.getElementById("likesText").textContent = "loading";
    document.getElementById("likeIcon").src = "/IMG/no_heart_icon.png";
    fetchMapInformation(name);

    const description = document.getElementById("descAuthor");
    const newDescription = description.cloneNode(true);
    description.parentNode.replaceChild(newDescription, description);
    newDescription.textContent = "by " + author;
    newDescription.addEventListener("click", () => {
        openProfile(authorId);
    });

    try {
        if (isAuthor) {
            const newButton = document.getElementById("manageDelete").cloneNode(true);
            document.getElementById("manageDelete").parentNode.replaceChild(newButton, document.getElementById("manageDelete"));
            newButton.style.display = "block";
            newButton.addEventListener("click", () => {
                deleteMapScreen(name);
            });

        } else {
            document.getElementById("manageDelete").style.display = "none";
        }
    } catch {
        console.error("Error adding delete button in mapScreen.js.");
    }

    const button = document.getElementById("mapLink");
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    document.getElementById("mapLink").addEventListener("click", () => {
        navigator.clipboard.writeText(window.location.origin + "/maps.html?map=" + name.split(" ").join("_"))
            .then(function () {
                document.getElementById("linkIcon").src = "/IMG/link_success_icon.png";
                setTimeout(() => {
                    document.getElementById("linkIcon").src = "/IMG/link_icon.png";
                }, 700);
            })
            .catch(function (error) {
                document.getElementById("linkIcon").src = "/IMG/link_error_icon.png";
                console.error("Copy error: " + error);
                setTimeout(() => {
                    document.getElementById("linkIcon").src = "/IMG/link_icon.png";
                }, 700);
            });
    });

    try {
        const newButton = document.getElementById("likeMap").cloneNode(true);
        document.getElementById("likeMap").parentNode.replaceChild(newButton, document.getElementById("likeMap"));
        newButton.addEventListener("click", () => {
            likeOrDislikeMap(name);
        });
    } catch (error) {
        console.error("Error adding like button in mapScreen.js and adding event listener:", error);
    }
}

document.getElementById("descClose").addEventListener("click", () => {
    document.getElementById("descriptionPopup").style.display = "none";
});

// fetch map information (Likes, like status if id is there)
async function fetchMapInformation(name) {
    try {
        let playerId = localStorage.getItem("id") || null;

        const response = await fetch(`https://maps.openguessr.com/maps/rating/${name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: playerId }), // playerId is optional
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("likesText").textContent = data.likeAmount + " likes";
            document.getElementById("likeIcon").src = data.liked ? "/IMG/heart_icon.png" : "/IMG/no_heart_icon.png";
        } else {
            console.error('Error loading map information and likes:', data.error);
        }
    } catch (error) {
        console.error('Network error during map information fetch:', error);
    }
}

// like or dislike maps 
async function likeOrDislikeMap(mapName) {
    if (localStorage.getItem("bearer") && localStorage.getItem("id")) {
        try {
            const response = await fetch(`https://maps.openguessr.com/maps/like/${mapName}`, {
                method: 'POST',
                headers: {
                    'Authorization': "Bearer " + localStorage.getItem("bearer"),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: localStorage.getItem("id") }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                await fetchMapInformation(mapName); // fetch new information
            } else {
                console.error('Error liking or disliking map:', data.error);
            }
        } catch (error) {
            console.error('Network error during like or dislike of map:', error);
        }
    } else {
        window.location.href = "/signup.html";
    }
}


let mapWasDeletedRefresh = false;

function deleteMapScreen(name) {
    document.getElementById("descriptionPopup").style.display = "none";
    document.getElementById("deleteHeader").textContent = "Delete " + name + "?";
    document.getElementById("deleteText").textContent = "This action cannot be undone. Do you wish to continue?";
    document.getElementById("deletePopup").style.display = "flex";
    document.getElementById("deleteProceed").style.display = "block";

    const newButton = document.getElementById("deleteProceed").cloneNode(true);
    document.getElementById("deleteProceed").parentNode.replaceChild(newButton, document.getElementById("deleteProceed"));
    newButton.addEventListener("click", async () => {
        document.getElementById("deleteText").textContent = await deleteMap(name);
        document.getElementById("deleteProceed").style.display = "none";
    });
}

document.getElementById("deleteClose").addEventListener("click", () => {
    document.getElementById("deletePopup").style.display = "none";
    if (mapWasDeletedRefresh) {
        window.location.reload();
    }
});

async function deleteMap(mapName) {
    // delete from database
    try {
        const body = {
            id: localStorage.getItem("id") // for auth
        }

        // Send POST request to the server
        const response = await fetch('https://maps.openguessr.com/maps/' + mapName, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ` + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        // Return the success or error message. No need to parse the response
        if (response.ok) {
            mapWasDeletedRefresh = true;
            return `Map deleted successfully.`;
        } else {
            console.error("Error deleting map: " + response.status);
            return "Failed to delete map: " + response.status;
        }
    } catch (error) {
        console.error('Error deleting map:', error);
        return "A network error occurred while deleting the map: " + error;
    }
}

function instantPlayPopup(mapName) {
    document.getElementById("instantPlayPopup").style.display = "flex";
    document.getElementById("instantPlayHeader").textContent = "Play " + mapName + "?";

    document.getElementById("instantPlayConfirm").addEventListener("click", () => {
        localStorage.setItem("selectedCategory", "community_" + mapName.toLowerCase());
        /* category variable names are always lowercase and have community_ in front of them, if they are community maps */
        addSelectedMap(mapName);

        if (inIframe()) {
            window.top.postMessage("close", "*");
            window.top.postMessage("reloadCommunityMaps", "*");
            window.top.postMessage("reloadCategory", "*");
        } else {
            window.location.href = "/";
        }
    });
}

document.getElementById("instantPlayClose").addEventListener("click", () => {
    document.getElementById("instantPlayPopup").style.display = "none";
});

// Search and categories ------------------------------------------------------------------------

document.querySelector(".categoriesBar").addEventListener("wheel", function (event) {
    event.preventDefault();
    this.scrollLeft += event.deltaY;
});

let currentSelection = document.getElementById("categoryAll");

// search with enter key
document.getElementById("mapSearch").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
    };
});

document.getElementById("mapSearch").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        startSearch();
    };
});

document.getElementById("startSearch").addEventListener("click", startSearch);

function startSearch() {
    let query = document.getElementById("mapSearch").value.toLowerCase();
    if (query == "") {
        query = undefined; // so the undefined check works in the load function
    }
    currentSelection = document.getElementById("categoryAll");
    categoryButtons.forEach(button => {
        button.classList.remove("selected");
    });
    document.getElementById("categoryAll").classList.add("selected");

    loadCommunityMaps(0, undefined, query);
}

// Add event listeners to all category buttons
const categoryButtons = document.querySelectorAll(".categoryButton");
categoryButtons.forEach(button => {
    button.addEventListener("click", handleCategoryButtonClick);
});

function handleCategoryButtonClick(event) {
    if (currentSelection) {
        currentSelection.classList.remove("selected");
    }

    event.target.classList.add("selected");
    currentSelection = event.target;
    const selectedCategory = currentSelection.textContent.toLowerCase();

    if (selectedCategory != "all") {
        loadCommunityMaps(0, selectedCategory);
    } else {
        loadCommunityMaps(0);
    }
}

// Call the function to load community maps
loadCommunityMaps(0);
loadCommunityMaps(undefined, undefined, undefined, true); // load favourite maps / load spotlight section

// Load more maps
document.getElementById("loadMore").addEventListener("click", () => {
    loadCommunityMaps(currentFetchIndex + 50, loadMoreCategoryParam, loadMoreQueryParam);
})

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
    document.getElementById("jsonUpload").value = ""; // reset filepicker input
}

document.getElementById("uploadClose").addEventListener("click", () => {
    document.getElementById("uploadPopup").style.display = "none";
    document.getElementById("fileName").textContent = "Pick file";
});

let mapSubmittedSuccessfully = false;

document.getElementById("uploadConfirmClose").addEventListener("click", () => {
    document.getElementById("uploadConfirmPopup").style.display = "none";
    if (mapSubmittedSuccessfully) {
        window.location.reload();
    }
});

document.getElementById("jsonInfoClose").addEventListener("click", () => {
    document.getElementById("jsonInfoPopup").style.display = "none";
});

document.getElementById("jsonFormatInfoSpan").addEventListener("click", () => {
    document.getElementById("jsonInfoPopup").style.display = "flex";
});

document.getElementById("uploadConfirmFinal").addEventListener("click", () => {
    document.getElementById("uploadConfirmClose").style.display = "block";
    document.getElementById("uploadConfirmFinal").style.display = "none";
    document.getElementById("uploadConfirmHeader").textContent = "Submitting map...";
    document.getElementById("uploadConfirmText").textContent = "Waiting for status...";
    uploadMap();
});

document.getElementById("jsonUploadButton").addEventListener('click', function () {
    document.getElementById("jsonUpload").click();
});

document.getElementById("jsonUpload").addEventListener('change', function () {
    var fileName = document.getElementById("fileName");
    fileName.textContent = this.files.length > 0 ? this.files[0].name : "Pick file";
});

async function uploadMap() {
    // if successful, close underlying menu
    let operationMessage = await submitMap();
    document.getElementById("uploadConfirmText").textContent = operationMessage;

    if (operationMessage.includes("success")) {
        document.getElementById("uploadConfirmHeader").textContent = "Map submitted!";

        const mapName = document.getElementById('uploadMapName').value;
        let playLink = window.location.origin + "/maps.html?map=" + mapName.split(" ").join("_")
        let linkBox = document.createElement("div");

        linkBox.innerHTML = `
        <div class="spacer"></div>
        <p>Play link:</p>
         <div class="halfSpacer"></div>
        <div class="linkBox">
        <p class="linkField">${playLink}</p>
        </div>
        `;

        document.getElementById("uploadConfirmText").appendChild(linkBox);
    } else {
        document.getElementById("uploadConfirmHeader").textContent = "Oh no! An error occured";
    }
}

async function submitMap() {
    let filePicker = document.getElementById("jsonUpload");
    let inputFromFilepicker = false;
    // Retrieve input values
    const name = document.getElementById('uploadMapName').value;
    const description = document.getElementById('uploadMapDescription').value;
    const mapData = filePicker.value ? filePicker.files[0] : document.getElementById('uploadMapData').value;
    inputFromFilepicker = filePicker.value ? true : false;
    const author = localStorage.getItem('username');
    const id = localStorage.getItem('id');
    const category = document.getElementById("categoryDropdown").value;

    // Validate inputs
    if (!name || !description || !mapData || !author || !id || category == "none") {
        return 'All fields and a selected category are required.';
    }

    // Construct the payload
    let payload;
    try {
        payload = {
            id,
            name,
            author,
            description,
            mapData: inputFromFilepicker ? await getJsonStringFromFile(mapData) : extractCoordinates(mapData), // assuming mapData is a JSON string
            category: category
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
                'Authorization': `Bearer ` + localStorage.getItem("bearer"),
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
            return `Map submitted successfully! Thank you so much for contributing.`;
        } else {
            let resultErrors = "";
            try {
                result.errors.forEach((e) => {
                    resultErrors += e.msg;
                    resultErrors += " ";
                });
            } catch (e) { }
            if (result.error != undefined || result.error != null) {
                resultErrors += result.error;
            }
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
        const seenCoordinates = new Set();
        let match;

        while ((match = regex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const long = parseFloat(match[2]);
            const coordPair = `${lat},${long}`;

            if (!seenCoordinates.has(coordPair)) {
                coordinates.push([lat, long]);
                seenCoordinates.add(coordPair);
            }
        }

        // Wrap coordinates with the outer object
        const output = JSON.stringify({ locations: coordinates }, null, 2);

        return output;
    } catch (error) {
        console.error("Error in extractCoordinates: " + error);
    }
}

async function getJsonStringFromFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = function (e) {
            const jsonString = e.target.result;
            try {
                JSON.parse(jsonString); // Validate JSON format
                resolve(jsonString);
            } catch (error) {
                reject(new Error("Failed to parse JSON: " + error));
            }
        };
        reader.onerror = function (e) {
            reject(new Error("Failed to read file: " + e));
        };
        reader.readAsText(file);
    });
}

// Start maps via links ----------------------------------------------------------------------------------

let urlParams = new URLSearchParams(window.location.search);

let mapNameFromLink;

try {
    mapNameFromLink = urlParams.get("map").split("_").join(" "); // remove all underscores
} catch { }

async function checkPlayMapFromLink() {
    let didErrorOccur = false;

    if (mapNameFromLink) {
        try {
            const response = await fetch("https://maps.openguessr.com/maps/" + mapNameFromLink);
            const data = await response.json();

            if (!response.ok) {
                didErrorOccur = true;
            }

        } catch (error) {
            didErrorOccur = true;
        }

        if (!didErrorOccur) {
            instantPlayPopup(mapNameFromLink);
        }

        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
}

checkPlayMapFromLink();
