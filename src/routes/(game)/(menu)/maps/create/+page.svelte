<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { username } from "$lib/stores/accountStore";
	import { goto } from "$app/navigation";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import { showNotification } from "$lib/utils/notifications";
	import { get } from "svelte/store";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Info } from "lucide-svelte";

	let jsonPopup = $state(false);
	let fileName = $state("Pick file");

	async function uploadMap() {
		// if successful, close underlying menu
		let operationMessage = await submitMap();

		if (operationMessage.includes("success")) {
			goto("/maps/community/" + mapName.replaceAll(" ", "_").toLowerCase()); // Open the map page after submitting
			showNotification("Thank you for contributing!");
		} else {
			errorPopup("Error occured uploading a map", "Please refer to the error code below.", operationMessage);
		}
	}

	let filePicker = $state();
	let mapName = $state();
	let mapDescription = $state();
	let uploadMapDataValue = $state();
	let categoryValue = $state();

	async function submitMap() {
		let inputFromFilepicker = false;
		const name = mapName;
		const description = mapDescription;
		const mapData = filePicker.value ? filePicker.files[0] : uploadMapDataValue;
		inputFromFilepicker = filePicker.value ? true : false;

		const author = get(username);
		const id = localStorage.getItem("id");
		const category = categoryValue;

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
			return "Error extracting the cordinates: " + error;
		}

		try {
			// Send POST request to the server
			const response = await fetch($accountUrl + "/maps", {
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
				return `Map submitted successfully!`; // must include "success"
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
	<title>Create a map</title>
</svelte:head>

<div class="mainContainer">
	<h1 class="header" id="uploadHeader">Create a map</h1>
	<div class="infoNoteBox">
		<h2 class="uploadFirstText">Important rules:</h2>
		<ul>
			<li>You can only upload max. 3 maps per day.</li>
			<li>Maps must at least have 50 unique locations.</li>
			<li>Ensure that your map names and author names are familiy-friendly.</li>
			<li>Keep all details in english.</li>
			<li>Pick a descriptive map name (e.g. not "My Map").</li>
			<li>A maximum of 2,000 locations is recommended, up to 15,000 are possible.</li>
		</ul>
	</div>
	<div class="inputArea">
		<p class="marginTop">Map name:</p>
		<input
			id="uploadMapName"
			class="uploadInfo"
			bind:value={mapName}
			type="text"
			style="width: 180px"
			placeholder="Name of your map..."
			maxlength="17"
		/>
		<p>Map category:</p>
		<select id="categoryDropdown" class="dropdown" bind:value={categoryValue}>
			<option value="none">Select one...</option>
			<option value="Nature">Nature</option>
			<option value="Architecture">Architecture</option>
			<option value="Urban">Urban</option>
			<option value="Regions">Regions</option>
			<option value="Sports">Sports</option>
			<option value="Transport">Transport</option>
			<option value="Miscellaneous">Miscellaneous</option>
		</select>
		<p>Map description:</p>
		<input
			id="uploadMapDescription"
			class="uploadInfo"
			type="text"
			placeholder="Description..."
			maxlength="300"
			bind:value={mapDescription}
		/>
		<div class="infoNoteBox">
			<p class="uploadFirstText">How to add locations:</p>
			<ol>
				<li>Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer.</li>
				<li>Drag the orange figure onto the map to open a streetview.</li>
				<li>Copy the URL from the address bar of your browser into the textbox.</li>
			</ol>
		</div>
		<p class="marginTop">Locations (as links):</p>
		<textarea
			id="uploadMapData"
			bind:value={uploadMapDataValue}
			class="uploadInfo locationTextbox"
			type="text"
			rows="20"
			placeholder="https://www.google.de/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=!3m6!1e1!3m4!1sux2El-iXh3zIk2rVfhDP5w!2e0!7i13312!8i6656?coh=205409&entry=ttu
      
https://www.google.de/maps/@50.3874953,11.2149744,3a,75y,327.9h,88.34t/data=!3m6!1e1!3m4!1scgVGr1HY1alolDg8gfwrzA!2e0!7i16384!8i8192?coh=205409&entry=ttu
      
https://www.google.de/maps/@50.3876752,11.2149082,3a,75y,13.59h,100.92t/data=!3m6!1e1!3m4!1sUaKFi34dUCFjIgkE5dQw1Q!2e0!7i16384!8i8192?coh=205409&entry=ttu"
		></textarea>
		<div class="infoNoteBox infoNoteBoxConverter">
			<p>
				You can generate a map using a tool like Map-Generator and then convert it to the
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<span
					id="jsonFormatInfoSpan"
					role="tooltip"
					onclick={() => {
						jsonPopup = true;
					}}>OpenGuessr JSON format</span
				>. Check out the official converter
				<a target="_blank" href="https://education.openguessr.com/tools/map-converter" class="linkToMapConverter"
					>here</a
				>.
			</p>
		</div>
		<button
			id="jsonUploadButton"
			class="standardButton white"
			onclick={() => {
				playSound("basic_button");
				jsonUpload.click();
			}}
		>
			<input
				type="file"
				id="jsonUpload"
				bind:this={filePicker}
				accept="application/json"
				onchange={(event) => {
					fileName = event.target.files.length > 0 ? event.target.files[0].name : "Pick file";
				}}
			/>
			<p id="fileName">{fileName}</p>
		</button>
	</div>
	<div class="buttonBoxRight fullWidth">
		<button
			id="uploadConfirm"
			class="standardButton closeButton submitButton"
			onclick={() => {
				playSound("basic_button");
				showConfirmPopup(
					"Submit?",
					"Some map details cannot be edited later! Violating the rules can result in a ban.",
					uploadMap,
				);
			}}>Submit</button
		>
	</div>
	{#if jsonPopup}
		<Popup verySlim={true}>
			<h1 class="popup-title">JSON format</h1>
			<p id="jsonFormatTextInfo">
				OpenGuessr uses a JSON format to load its locations. Here is an example of how that looks like:
			</p>
			<br />
			<div class="preBox">
				<pre>
        &lbrace;
          "locations": [
                  [latitude, longitude],
                  [latitude, longitude],
                  [latitude, longitude],
                  ...
                  [latitude, longitude]
              ]
        &rbrace;</pre>
			</div>
			<div class="buttonBoxRight">
				<button
					id="jsonInfoClose"
					class="standardButton closeButton white"
					onclick={() => {
						playSound("basic_button");
						jsonPopup = false;
					}}>Close</button
				>
			</div>
		</Popup>
	{/if}
</div>

<style>
	.mainContainer {
		width: calc(100% - 20px);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding-inline: 10px;
	}

	#uploadHeader {
		margin-bottom: 30px;
	}

	#jsonUploadButton {
		margin-top: 10px;
		padding-top: 2px;
		padding-bottom: 2px;
		border-radius: 10px;
		min-height: 50px;
		min-width: 150px;
	}

	#jsonFormatInfoSpan {
		text-decoration: underline;
		cursor: pointer;
	}

	.uploadFirstText {
		margin-bottom: 15px;
		margin-top: 10px;
		font-size: 22px;
	}

	.linkToMapConverter {
		cursor: pointer;
		text-decoration: underline;
	}

	#jsonUpload {
		display: none;
	}

	.fullWidth {
		width: 100%;
	}

	.submitButton {
		border-radius: 10px;
		margin-top: var(--box-margin);
		margin-bottom: var(--layout-margin);
	}

	.infoNoteBox {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		padding: 10px;
		padding-inline: 20px;
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: calc(100% - 40px);
	}

	.preBox {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		display: flex;
		padding: var(--box-margin);
		width: calc(100% - 20px);
		justify-content: flex-start;
		flex-direction: column;
	}

	.inputArea {
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: 100%;
		margin-top: 15px;
	}

	.uploadInfo {
		border-radius: 10px;
		width: 75%;
		min-height: 30px;
		border: none;
		padding: 10px;
		padding-inline: 20px;
		margin-bottom: 20px;
		margin-top: var(--box-margin);
		color: white;
	}

	.locationTextbox {
		min-height: 350px;
		font-size: 16px;
		width: calc(100% - 30px);
		padding: 20px;
		transition: background-color 250ms ease;
	}

	.locationTextbox:focus {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.marginTop {
		margin-top: 15px;
	}

	li {
		color: white;
		font-size: 22px;
	}

	pre {
		font-family: monospace;
		white-space: pre-wrap;
		font-size: 15px;
		padding: var(--box-margin);
	}

	.infoNoteBoxConverter {
		margin-top: 25px;
		margin-bottom: 15px;
	}

	.dropdown {
		margin-bottom: 20px;
		margin-top: 10px;
		width: 150px;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		min-height: 50px;
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
</style>
