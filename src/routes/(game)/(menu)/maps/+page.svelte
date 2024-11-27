<script>
  import { Plus } from "lucide-svelte";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { onMount } from "svelte";

  // Load community maps using the openguessr map api  -----------------------------------------------------
  let currentFetchIndex = 0;

  let loadMoreCategoryParam = undefined;
  let loadMoreQueryParam = undefined;

  let showLoadMore = $state(false);
  let showNothingFound = $state(false);
  let errorMessageText = $state("Loading...");
  let errorMessageShown = $state(true);

  async function loadCommunityMaps(index, category, query, fav) {
    try {
      showLoadMore = false;
      showNothingFound = false;
      errorMessageText = "Loading...";

      loadMoreCategoryParam = category;
      loadMoreQueryParam = query;

      // this if block resets the index to 0 if a new loading method is being used
      if (index == 0 || index == undefined) {
        document.getElementById("community-maps").innerHTML = "";
      }

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
          showLoadMore = true;
        }

        let nothingFound = true;

        data.communityMaps.forEach((map) => {
          // fav maps are only being added if fav is defined/true
          if (!map.favourite || fav) {
            addMap(map.name, map.author, map.authorId, map.favourite, map.author, map.description, map.category);
            nothingFound = false;
          }
        });

        if (showNothingFound && !fav) {
          showNothingFound = true;
        }
      } else {
        console.error("Error loading community maps: " + response.status);
        errorMessageShown = true;
        errorMessageText = "Error: " + response.status;
      }
    } catch (error) {
      console.error("Error loading community maps: " + error);
      errorMessageShown = true;
      errorMessageText = "Error: " + error;
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

    if (creatorId == localStorage.getItem("id") && localStorage.getItem("id") && !fav) {
      // favorite (spotlight) maps should not be deletable
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

  // Add / Remove from user section
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
      loadProfileFromId(authorId, true);
    });

    try {
      if (isAuthor) {
        const newButton = document.getElementById("manageDelete").cloneNode(true);
        document
          .getElementById("manageDelete")
          .parentNode.replaceChild(newButton, document.getElementById("manageDelete"));
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

    try {
      if (isAuthor) {
        const newButton = document.getElementById("manageUpdate").cloneNode(true);
        document
          .getElementById("manageUpdate")
          .parentNode.replaceChild(newButton, document.getElementById("manageUpdate"));
        newButton.style.display = "block";
        newButton.addEventListener("click", () => {
          updateMapScreen(name);
        });
      } else {
        document.getElementById("manageUpdate").style.display = "none";
      }
    } catch {
      console.error("Error adding update button in mapScreen.js.");
    }

    const button = document.getElementById("mapLink");
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    document.getElementById("mapLink").addEventListener("click", () => {
      navigator.clipboard
        .writeText(window.location.origin + "/maps.html?map=" + name.split(" ").join("_"))
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: playerId }), // playerId is optional
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById("likesText").textContent = data.likeAmount + " likes";
        document.getElementById("likeIcon").src = data.liked ? "/IMG/heart_icon.png" : "/IMG/no_heart_icon.png";
      } else {
        console.error("Error loading map information and likes:", data.error);
      }
    } catch (error) {
      console.error("Network error during map information fetch:", error);
    }
  }

  // like or dislike maps
  async function likeOrDislikeMap(mapName) {
    if (localStorage.getItem("bearer") && localStorage.getItem("id")) {
      try {
        const response = await fetch(`https://maps.openguessr.com/maps/like/${mapName}`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("bearer"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: localStorage.getItem("id") }),
        });

        const data = await response.json();

        if (response.ok) {
          await fetchMapInformation(mapName); // fetch new information
        } else {
          console.error("Error liking or disliking map:", data.error);
        }
      } catch (error) {
        console.error("Network error during like or dislike of map:", error);
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
    document
      .getElementById("deleteProceed")
      .parentNode.replaceChild(newButton, document.getElementById("deleteProceed"));
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
        id: localStorage.getItem("id"), // for auth
      };

      // Send POST request to the server
      const response = await fetch("https://maps.openguessr.com/maps/" + mapName, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
      console.error("Error deleting map:", error);
      return "A network error occurred while deleting the map: " + error;
    }
  }

  function updateMapScreen(name) {
    document.getElementById("mapUpdatePopup").style.display = "flex";
    document.getElementById("mapUpdateHeader").style.display = "Update " + name;
    document.getElementById("jsonUpdate").value = ""; // reset filepicker input
    document.getElementById("updateMapStatus").style.display = "none";

    const newButton = document.getElementById("updateProceed").cloneNode(true);
    document
      .getElementById("updateProceed")
      .parentNode.replaceChild(newButton, document.getElementById("updateProceed"));
    newButton.addEventListener("click", async () => {
      document.getElementById("updateMapStatus").style.display = "block";
      document.getElementById("updateMapStatus").textContent = "Updating...";
      document.getElementById("updateMapStatus").textContent = "Status: " + (await updateMap(name));
    });
  }

  document.getElementById("updateClose").addEventListener("click", () => {
    document.getElementById("mapUpdatePopup").style.display = "none";
    document.getElementById("fileNameUpdate").textContent = "Pick file";
  });

  document.getElementById("jsonUpdateButton").addEventListener("click", function () {
    document.getElementById("jsonUpdate").click();
  });

  document.getElementById("jsonUpdate").addEventListener("change", function () {
    var fileName = document.getElementById("fileNameUpdate");
    fileName.textContent = this.files.length > 0 ? this.files[0].name : "Pick file";
  });

  async function updateMap(mapName) {
    let filePicker = document.getElementById("jsonUpdate");
    let inputFromFilepicker = false;
    const mapData = filePicker.value ? filePicker.files[0] : document.getElementById("updateMapData").value;
    inputFromFilepicker = filePicker.value ? true : false;

    try {
      const body = {
        id: localStorage.getItem("id"),
        name: mapName,
        mapData: inputFromFilepicker ? await getJsonStringFromFile(mapData) : extractCoordinates(mapData),
      };

      // Send POST request to the server
      const response = await fetch("https://maps.openguessr.com/maps", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Return the success or error message. No need to parse the response
      if (response.ok) {
        return `Map updated successfully.`;
      } else {
        console.error("Error updating map: " + response.status);
        return "Failed to update map: " + response.status;
      }
    } catch (error) {
      console.error("Error updating map:", error);
      return "A network error occurred while updating the map: " + error;
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
        window.parent.postMessage("close", "*");
        window.parent.postMessage("reloadCommunityMaps", "*");
        window.parent.postMessage("reloadCategory", "*");
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
    }
  });

  document.getElementById("mapSearch").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      startSearch();
    }
  });

  document.getElementById("startSearch").addEventListener("click", startSearch);

  function startSearch() {
    let query = document.getElementById("mapSearch").value.toLowerCase();
    if (query == "") {
      query = undefined; // so the undefined check works in the load function
    }
    currentSelection = document.getElementById("categoryAll");
    categoryButtons.forEach((button) => {
      button.classList.remove("selected");
    });
    document.getElementById("categoryAll").classList.add("selected");

    loadCommunityMaps(0, undefined, query);
  }

  // Add event listeners to all category buttons
  const categoryButtons = document.querySelectorAll(".categoryButton");
  categoryButtons.forEach((button) => {
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
  });

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
    document.getElementById("uploadConfirmText").textContent =
      "Some map details cannot be edited later! Violating the rules can result in a permanent ban.";
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

  document.getElementById("jsonFormatInfoSpanUpdate").addEventListener("click", () => {
    document.getElementById("jsonInfoPopup").style.display = "flex";
  });

  document.getElementById("uploadConfirmFinal").addEventListener("click", () => {
    document.getElementById("uploadConfirmClose").style.display = "block";
    document.getElementById("uploadConfirmFinal").style.display = "none";
    document.getElementById("uploadConfirmHeader").textContent = "Submitting map...";
    document.getElementById("uploadConfirmText").textContent = "Waiting for status...";
    uploadMap();
  });

  document.getElementById("jsonUploadButton").addEventListener("click", function () {
    document.getElementById("jsonUpload").click();
  });

  document.getElementById("jsonUpload").addEventListener("change", function () {
    var fileName = document.getElementById("fileName");
    fileName.textContent = this.files.length > 0 ? this.files[0].name : "Pick file";
  });

  async function uploadMap() {
    // if successful, close underlying menu
    let operationMessage = await submitMap();
    document.getElementById("uploadConfirmText").textContent = operationMessage;

    if (operationMessage.includes("success")) {
      document.getElementById("uploadConfirmHeader").textContent = "Map submitted!";

      const mapName = document.getElementById("uploadMapName").value;
      let playLink = window.location.origin + "/maps.html?map=" + mapName.split(" ").join("_");
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
    const name = document.getElementById("uploadMapName").value;
    const description = document.getElementById("uploadMapDescription").value;
    const mapData = filePicker.value ? filePicker.files[0] : document.getElementById("uploadMapData").value;
    inputFromFilepicker = filePicker.value ? true : false;
    const author = localStorage.getItem("username");
    const id = localStorage.getItem("id");
    const category = document.getElementById("categoryDropdown").value;

    // Validate inputs
    if (!name || !description || !mapData || !author || !id || category == "none") {
      return "All fields and a selected category are required.";
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
        category: category,
      };
    } catch (error) {
      console.error("Error creating payload and extracting coordinates: " + error);
      return "Your list of streetview links could not be converted to coordinates.";
    }

    try {
      // Send POST request to the server
      const response = await fetch("https://maps.openguessr.com/maps", {
        method: "POST",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        } catch (e) {}
        if (result.error != undefined || result.error != null) {
          resultErrors += result.error;
        }
        console.error("Errors occured during map submission on the server: " + resultErrors);
        return resultErrors || "Failed to submit map.";
      }
    } catch (error) {
      console.error("Error submitting map:", error);
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

  onMount(() => {
    let urlParams = new URLSearchParams(window.location.search);
    let mapNameFromLink;

    try {
      mapNameFromLink = urlParams.get("map").split("_").join(" "); // remove all underscores
    } catch {}

    async function checkPlayMapFromLink() {
      let didErrorOccur = false;

      if (mapNameFromLink) {
        try {
          const response = await fetch("https://maps.openguessr.com/maps/" + mapNameFromLink);
          const data = await response.json();

          if (!response.ok) didErrorOccur = true;
        } catch (error) {
          didErrorOccur = true;
        }

        if (!didErrorOccur) instantPlayPopup(mapNameFromLink);
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
      }
    }

    checkPlayMapFromLink();
  });
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div id="descriptionPopup" class="popupHolder">
  <div id="description" class="uiWindow">
    <div class="headerBox">
      <h1 id="descHeader">Default map</h1>
      <button id="likeMap" class="standardButton">
        <img alt="likeIcon" id="likeIcon" src="/img/no_heart_icon.png" />
        <p id="likesText">loadig...</p>
      </button>
    </div>
    <p id="descAuthor" class="textEllipsis">by Paul</p>
    <p id="descText" class="textEllipsis">
      This is a wonderful description of the default map. It features big default locations and small default locations.
      Wow.
    </p>
    <div class="buttonBox">
      <button id="mapLink" class="closeButton standardButton">
        <img id="linkIcon" src="/img/link_icon.png" alt="copy link" />
      </button>
      <button id="manageDelete" class="standardButton closeButton manageDelete">Delete</button>
      <button id="manageUpdate" class="standardButton closeButton">Update</button>
      <button id="descClose" class="standardButton closeButton">Close</button>
    </div>
  </div>
</div>
<div id="deletePopup" class="popupHolder">
  <div id="deleteWindow" class="uiWindow">
    <h1 id="deleteHeader">Delete default map?</h1>
    <p id="deleteText" class="textEllipsis">This action cannot be undone. Do you wish to continue?</p>
    <div class="buttonBox">
      <button id="deleteClose" class="standardButton closeButton">Cancel</button>
      <button id="deleteProceed" class="standardButton closeButton manageDelete">Delete</button>
    </div>
  </div>
</div>
<div id="mapUpdatePopup" class="popupHolder">
  <div id="mapUpdateWindow" class="uiWindow">
    <h1 id="mapUpdateHeader">Update locations</h1>
    <p class="marginTop" id="updateMapStatus">Default</p>
    <p class="marginTop">Locations:</p>
    <textarea
      id="updateMapData"
      class="uploadInfo locationTextbox"
      type="text"
      rows="20"
      placeholder="https://www.google.de/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=!3m6!1e1!3m4!1sux2El-iXh3zIk2rVfhDP5w!2e0!7i13312!8i6656?coh=205409&entry=ttu

https://www.google.de/maps/@50.3874953,11.2149744,3a,75y,327.9h,88.34t/data=!3m6!1e1!3m4!1scgVGr1HY1alolDg8gfwrzA!2e0!7i16384!8i8192?coh=205409&entry=ttu

https://www.google.de/maps/@50.3876752,11.2149082,3a,75y,13.59h,100.92t/data=!3m6!1e1!3m4!1sUaKFi34dUCFjIgkE5dQw1Q!2e0!7i16384!8i8192?coh=205409&entry=ttu"
      maxlength="5000000"
    ></textarea>
    <p>You can upload a JSON file with <span id="jsonFormatInfoSpanUpdate">this formatting</span>:</p>
    <button id="jsonUpdateButton" class="standardButton">
      <input type="file" id="jsonUpdate" accept="application/json" />
      <p id="fileNameUpdate">Pick file</p>
    </button>
    <div class="buttonBox">
      <button id="updateClose" class="standardButton closeButton">Close</button>
      <button id="updateProceed" class="standardButton playButton">Update</button>
    </div>
  </div>
</div>
<div id="instantPlayPopup" class="popupHolder">
  <div id="description" class="uiWindow">
    <h1 id="instantPlayHeader">Default map</h1>
    <p id="instantPlayText">This will add the map to your selection and start the game immediately. Continue?</p>
    <div class="buttonBox">
      <button id="instantPlayClose" class="standardButton closeButton">Close</button>
      <button id="instantPlayConfirm" class="standardButton playButton">Play</button>
    </div>
  </div>
</div>
<div id="uploadPopup" class="popupHolder">
  <div id="uploadWindow" class="uiWindow">
    <h1 id="uploadHeader">Upload Map</h1>
    <div class="infoNoteBox">
      <img id="infoNoteIcon" src="./img/info_icon.png" alt="Information Icon" />
      <p id="uploadFirstText">Rules (please read before submitting a map):</p>
      <ul>
        <li>You can only upload max. 3 maps per day.</li>
        <li>Maps must at least have 50 unique locations.</li>
        <li>Ensure that your map names and author names are familiy-friendly.</li>
        <li>Keep all details in english.</li>
        <li>Pick a descriptive map name (e. g. not "My Map").</li>
        <li>A maximum of 1000 locations is recommended.</li>
        <li>Maps cannot be edited!</li>
      </ul>
    </div>
    <div id="inputArea">
      <p class="marginTop">Map name:</p>
      <input
        id="uploadMapName"
        class="uploadInfo"
        type="text"
        style="width: 180px"
        placeholder="Name of your map..."
        maxlength="17"
      />
      <p>Map Category:</p>
      <select id="categoryDropdown" class="dropdown">
        <option value="none">Select one...</option>
        <option value="Nature">Nature</option>
        <option value="Architecture">Architecture</option>
        <option value="Urban">Urban</option>
        <option value="Regions">Regions</option>
        <option value="Sports">Sports</option>
        <option value="Transport">Transport</option>
        <option value="Miscellaneous">Miscellaneous</option>
      </select>
      <p>Map Description:</p>
      <input id="uploadMapDescription" class="uploadInfo" type="text" placeholder="Description..." maxlength="300" />
      <div class="infoNoteBox">
        <img id="infoNoteIcon" src="./img/info_icon.png" alt="Information Icon" />
        <p id="uploadFirstText">How to add locations:</p>
        <ol>
          <li>Visit <a href="https://www.google.com/maps/">Google Maps</a> on a desktop computer.</li>
          <li>Drag the orange figure onto the map to open a streetview.</li>
          <li>Copy the URL from the address bar of your browser into the textbox.</li>
        </ol>
      </div>
      <p class="marginTop">Locations (as links):</p>
      <textarea
        id="uploadMapData"
        class="uploadInfo locationTextbox"
        type="text"
        rows="20"
        placeholder="https://www.google.de/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=!3m6!1e1!3m4!1sux2El-iXh3zIk2rVfhDP5w!2e0!7i13312!8i6656?coh=205409&entry=ttu

https://www.google.de/maps/@50.3874953,11.2149744,3a,75y,327.9h,88.34t/data=!3m6!1e1!3m4!1scgVGr1HY1alolDg8gfwrzA!2e0!7i16384!8i8192?coh=205409&entry=ttu

https://www.google.de/maps/@50.3876752,11.2149082,3a,75y,13.59h,100.92t/data=!3m6!1e1!3m4!1sUaKFi34dUCFjIgkE5dQw1Q!2e0!7i16384!8i8192?coh=205409&entry=ttu"
        maxlength="5000000"
      ></textarea>
      <div class="infoNoteBox infoNoteBoxConverter">
        <img id="infoNoteIcon" src="./img/info_icon.png" alt="Information Icon" />
        <p id="infoTextMapConverter">
          You can generate a map using a tool like Map-Generator and then convert it to the OpenGuessr format. Learn
          more <a target="_blank" href="https://education.openguessr.com/tools/map-converter" class="linkToMapConverter"
            >here</a
          >.
        </p>
      </div>
      <p>Locations from a JSON file with <span id="jsonFormatInfoSpan">this formatting</span>:</p>
      <button id="jsonUploadButton" class="standardButton">
        <input type="file" id="jsonUpload" accept="application/json" />
        <p id="fileName">Pick file</p>
      </button>
    </div>
    <div class="buttonBox">
      <button id="uploadClose" class="standardButton closeButton">Close</button>
      <button id="uploadConfirm" class="standardButton playButton">Submit</button>
    </div>
  </div>
</div>
<div id="uploadConfirmPopup" style="z-index: 101;" class="popupHolder">
  <div class="uiWindow">
    <h1 id="uploadConfirmHeader">Are you sure?</h1>
    <p id="uploadConfirmText">Default text</p>
    <div class="buttonBox">
      <button id="uploadConfirmClose" class="standardButton closeButton">Close</button>
      <button id="uploadConfirmFinal" class="standardButton playButton">Yes, submit</button>
    </div>
  </div>
</div>
<div id="jsonInfoPopup" class="popupHolder">
  <div id="JsonInfoWindow" class="uiWindow">
    <h1 id="JsonInfoPlayHeader">JSON Format</h1>
    <p id="jsonFormatTextInfo">
      OpenGuessr uses a JSON format to load its locations. Here is an example of how that looks like:
    </p>
    <br />
    <div class="infoNoteBox">
      <img id="infoNoteIcon" src="./img/info_icon.png" alt="Information Icon" />
      <pre>
&rbrace
    "locations": [
            [latitude, longitude],
            [latitude, longitude],
            [latitude, longitude],
            ...and so on...
            [latitude, longitude]
        ]
&rcub;
                </pre>
    </div>
    <div class="buttonBox">
      <button id="jsonInfoClose" class="standardButton closeButton">Close</button>
    </div>
  </div>
</div>
<div class="main-container">
  <div class="map-container">
    <div class="headerContainer">
      <h2 class="header">Community Spotlight:</h2>
    </div>
    <div id="featured-map" class="map-container">
      <!-- Featured maps will be injected here -->
    </div>
  </div>
  <div class="headerContainer">
    <h2 class="header">Community Maps:</h2>
    <button id="uploadButton" class="standardButton primaryButtonHighlight">+ Upload</button>
    <div class="categoriesSearchArea">
      <div class="categoriesBar">
        <button id="categoryAll" class="selected categoryButton standardButton">All</button>
        <button class="categoryButton standardButton">Nature</button>
        <button class="categoryButton standardButton">Architecture</button>
        <button class="categoryButton standardButton">Urban</button>
        <button class="categoryButton standardButton">Regions</button>
        <button class="categoryButton standardButton">Sports</button>
        <button class="categoryButton standardButton">Transport</button>
        <button class="categoryButton standardButton">Miscellaneous</button>
      </div>
      <search>
        <form>
          <input id="mapSearch" placeholder="Search Maps..." />
        </form>
        <button id="startSearch" class="standardButton white">
          <img src="/img/find_icon.png" alt="start search" id="searchIcon" />
        </button>
      </search>
    </div>
  </div>
  <div id="community-maps" class="map-container">
    <!-- Community maps will be injected here -->
  </div>
  {#if errorMessageShown}
    <p id="errorMessage">{errorMessageText}</p>
  {/if}
  {#if showNothingFound}
    <p id="nothingFound" style="opacity: 0.5;">No map matches the search query.</p>
  {/if}
  {#if showLoadMore}
    <button id="loadMore" class="standardButton"
      >Show more <span class="loadMoreIconSpan"><Plus strokeWidth={2} /></span></button
    >
  {/if}
</div>

<style>
  .main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 0 auto;
  }

  .headerContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px;
    padding-inline: 0;
    gap: 12px;
  }

  .loadMoreIconSpan {
    vertical-align: -4px;
  }

  .header {
    text-align: center;
    font-size: 45px;
    color: white;
  }

  .map-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 12px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    max-width: 300px;
    user-select: none;
    cursor: pointer;
    transition:
      opacity 250ms ease,
      background-color 250ms ease;
    opacity: 0;
    /* later being faded in using JS */
  }

  .map-item:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .ourFavourites {
    background-color: rgb(141, 111, 158);
  }

  .ourFavourites:hover {
    background-color: rgb(157, 126, 175);
  }

  .map-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .map-name {
    font-size: 22px;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
  }

  .map-author {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    max-width: 110px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-desc {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 5px 7px;
    margin-left: auto;
    cursor: pointer;
    user-select: none;
    transition: background-color 250ms ease;
  }

  .map-desc:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .map-desc span {
    margin-inline: 5px;
  }

  .map-desc-owned {
    background-color: rgba(255, 255, 255, 0.8);
    color: black;
  }

  .map-desc-owned:hover {
    background-color: rgba(255, 255, 255, 1);
    color: black;
  }

  .map-container {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .add-button {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 5px;
    padding: 5px 7px;
    cursor: pointer;
    user-select: none;
    margin-left: 10px;
    font-size: 25px;
    width: 35px;
    line-height: 0.9;
    transition: background-color 250ms ease;
  }

  .fav-add-button {
    color: black;
    background-color: rgba(235, 169, 169, 0.2);
  }

  .heart-icon {
    width: 22px;
    height: auto;
    vertical-align: -1px;
  }

  .add-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .primaryButtonHighlight {
    background-color: rgb(153, 82, 193);
    color: white;
  }

  #community-maps {
    width: calc(100% - 40px);
    margin-bottom: 50px;
  }

  .playButton {
    margin-top: 40px;
    background-color: rgb(151, 94, 184);
    color: white;
  }

  #nothingFound {
    display: none;
    margin-top: -50px;
    margin-bottom: 20px;
  }

  #descHeader {
    margin-bottom: -2px;
    margin-top: 0;
    max-width: 55%;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #descAuthor {
    margin-bottom: 30px;
    font-size: 30px;
    transition: opacity 250ms ease;
    cursor: pointer;
    user-select: none;
    width: fit-content;
  }

  #descAuthor:hover {
    opacity: 0.5;
  }

  #descriptionPopup {
    display: none;
  }

  #submissionInfo {
    margin-bottom: 50px;
    opacity: 50%;
    font-size: 22px;
    width: 100%;
    text-align: center;
  }

  #mapSearch {
    border-radius: 10px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    width: calc(100% - 20px);
    max-width: 500px;
    transition: background-color 250ms ease;
    font-size: 22px;
    border: none;
    font-family: Barlow;
    padding: 5px;
    padding-inline: 10px;
    text-overflow: ellipsis;
  }

  #startSearch {
    border-radius: 10px;
    max-width: 50px;
    margin: 0;
    margin-right: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #uploadButton {
    border-radius: 10px;
    min-height: 50px;
  }

  #jsonUpload,
  #jsonUpdate {
    display: none;
  }

  #jsonUploadButton,
  #jsonUpdateButton {
    background-color: rgba(255, 255, 255, 0.1);
    margin-top: 10px;
    color: white;
    padding-top: 2px;
    padding-bottom: 2px;
  }

  #jsonFormatInfoSpan {
    text-decoration: underline;
    cursor: pointer;
  }

  .linkToMapConverter {
    cursor: pointer;
    text-decoration: underline;
  }

  .uploadInfo {
    border-radius: 10px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    width: 75%;
    font-size: 22px;
    min-height: 30px;
    font-family: Barlow;
    border: none;
    padding: 5px;
    padding-inline: 20px;
    margin-bottom: 20px;
    margin-top: 10px;
    transition: background-color 250ms ease;
  }

  .uploadInfo:focus {
    background-color: rgba(255, 255, 255, 0.2);
  }

  input:focus {
    outline: none;
    border: none;
  }

  #mapSearch:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.2);
  }

  #instantPlayPopup {
    display: none;
  }

  #uploadPopup {
    display: none;
  }

  #deletePopup {
    display: none;
  }

  #mapUpdatePopup {
    display: none;
  }

  #uploadHeader,
  #instantPlayHeader,
  #mapUpdateHeader,
  #JsonInfoPlayHeader {
    margin-top: 5px;
  }

  .infoNoteBox {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    padding-inline: 30px;
  }

  #inputArea {
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }

  #uploadConfirmPopup {
    display: none;
  }

  .locationTextbox {
    min-height: 350px;
    font-size: 12px;
    width: 90%;
    padding: 15px;
  }

  .marginTop {
    margin-top: 15px;
  }

  #infoNoteIcon {
    width: 35px;
    height: 35px;
    margin-bottom: 20px;
    margin-top: 7px;
    opacity: 0.5;
    margin-left: -10px;
  }

  pre {
    font-family: monospace;
    white-space: pre-wrap;
    font-size: 15px;
  }

  .textEllipsis {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #uploadWindow {
    max-width: 900px;
  }

  #uploadMapData {
    margin-bottom: 5px;
  }

  #jsonInfoPopup {
    display: none;
  }

  #uploadConfirmText {
    margin-bottom: 50px;
  }

  #linkIcon {
    width: 20px;
    height: 20px;
    padding: 0;
    vertical-align: -2px;
  }

  .buttonBox {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-inline: 15px;
    gap: 5px;
  }

  .categoriesBar {
    overflow: hidden;
    overflow-x: scroll;
    border-radius: 10px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 5px;
    padding: 5px;
    scrollbar-width: none;
  }

  .categoryButton {
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
    border: none;
    color: white;
    max-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .categoryButton:hover {
    filter: none;
    background-color: rgba(255, 255, 255, 0.3);
  }

  .selected {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .categoriesSearchArea {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 100%;
    min-width: 280px;
    gap: 10px;
    align-items: center;
    border-radius: 13px;
    padding: 5px;
    background-color: rgba(255, 255, 255, 0.05);
  }

  .dropdown {
    margin-bottom: 15px;
    margin-top: 5px;
    width: 150px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    min-height: 30px;
    color: white;
    border: none;
    font-size: 22px;
    font-family: inherit;
    padding: 5px;
    cursor: pointer;
  }

  select option {
    background-color: rgb(74, 74, 74);
    color: white;
  }

  #loadMore {
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 22px;
    min-height: 40px;
    width: 280px;
    padding: 10px;
    margin-bottom: 30px;
    margin-top: -20px;
    padding-bottom: 7px;
  }

  #errorMessage {
    margin-bottom: 50px;
  }

  #searchIcon {
    width: 20px;
    height: 20px;
  }

  .manageDelete {
    background-color: rgb(173, 53, 65);
    color: rgb(255, 255, 255);
  }

  #deleteHeader {
    margin-top: 10px;
  }

  .headerBox {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  #likesText {
    opacity: 0.5;
    margin-top: 5px;
    margin-bottom: 3px;
    margin-left: 12px;
    font-size: 22px;
  }

  #likeMap {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    margin-left: auto;
    padding-inline: 12px;
    display: flex;
    align-items: center;
    padding-bottom: 5px;
    padding-top: 5px;
    margin-top: auto;
    margin-bottom: 2px;
  }

  #likeIcon {
    width: 25px;
    height: 25px;
    margin-top: 2px;
  }

  #updateMapStatus {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 5px;
    border-radius: 10px;
    padding-inline: 15px;
    width: 90%;
  }

  .infoNoteBoxConverter {
    margin-top: 25px;
    margin-bottom: 15px;
  }

  #infoTextMapConverter {
    margin-bottom: 20px;
  }

  @media all and (orientation: portrait), all and (max-width: 800px) {
    .categoriesSearchArea {
      width: 50%;
    }

    p {
      font-size: 20px;
    }

    li {
      font-size: 20px;
    }

    .header {
      font-size: 35px;
    }

    .categoryButton {
      font-size: 18px;
      min-height: 30px;
    }

    #descAuthor {
      font-size: 25px;
    }
  }
</style>
