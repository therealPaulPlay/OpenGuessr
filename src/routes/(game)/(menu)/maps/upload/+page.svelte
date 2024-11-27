<script>
  import Popup from "$lib/components/Popup.svelte";

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
</script>

<svelte:head>
  <title>Upload a Map</title>
</svelte:head>

<div class="mainContainer">
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
            more <a
              target="_blank"
              href="https://education.openguessr.com/tools/map-converter"
              class="linkToMapConverter">here</a
            >.
          </p>
        </div>
        <p>Locations from a JSON file with <span id="jsonFormatInfoSpan">this formatting</span>:</p>
        <button id="jsonUploadButton" class="standardButton">
          <input type="file" id="jsonUpload" accept="application/json" />
          <p id="fileName">Pick file</p>
        </button>
      </div>
      <div class="buttonBoxRight">
        <button id="uploadClose" class="standardButton closeButton">Close</button>
        <button id="uploadConfirm" class="standardButton playButton">Submit</button>
      </div>
    </div>
  </div>
  <div id="uploadConfirmPopup" style="z-index: 101;" class="popupHolder">
    <div class="uiWindow">
      <h1 id="uploadConfirmHeader">Are you sure?</h1>
      <p id="uploadConfirmText">Default text</p>
      <div class="buttonBoxRight">
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
      <div class="buttonBoxRight">
        <button id="jsonInfoClose" class="standardButton closeButton">Close</button>
      </div>
    </div>
  </div>
</div>

<style>
  .mainContainer {
    width: calc(100% - 20px);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding-inline: 10px;
  }

  #jsonUploadButton {
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

  #mapSearch:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.2);
  }

  #uploadHeader,
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
    padding: 10px;
    padding-inline: 20px;
    margin-bottom: 20px;
    margin-top: 10px;
    transition: background-color 250ms ease;
  }

  .uploadInfo:focus {
    background-color: rgba(255, 255, 255, 0.2);
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

  .infoNoteBoxConverter {
    margin-top: 25px;
    margin-bottom: 15px;
  }

  #infoTextMapConverter {
    margin-bottom: 20px;
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

  #uploadMapData {
    margin-bottom: 5px;
  }

  #uploadConfirmText {
    margin-bottom: 50px;
  }
</style>
