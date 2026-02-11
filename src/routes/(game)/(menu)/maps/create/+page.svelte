<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { goto } from "$app/navigation";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import { showNotification } from "$lib/utils/notifications";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Upload } from "@lucide/svelte";
	import Drawer from "$lib/components/ui/Drawer.svelte";

	let jsonPopup = $state(false);
	let fileName = $state("Pick file");
	let filePicker = $state();
	let mapName = $state();
	let mapDescription = $state();
	let uploadMapDataValue = $state();
	let categoryValue = $state();

	async function combineMapData() {
		const locations = [];

		// Add locations from textarea
		if (uploadMapDataValue?.trim()) {
			const textLocations = extractCoordinates(uploadMapDataValue);
			locations.push(...JSON.parse(textLocations).locations);
		}

		// Add locations from file
		if (filePicker?.files?.[0]) {
			const fileLocations = await getJsonStringFromFile(filePicker.files[0]);
			locations.push(...JSON.parse(fileLocations).locations);
		}

		return JSON.stringify({ locations });
	}

	async function uploadMap() {
		const operationMessage = await submitMap();
		if (operationMessage.includes("success")) {
			goto("/maps/community/" + mapName.replaceAll(" ", "_").toLowerCase());
			showNotification("Map created!");
		} else {
			errorPopup("Error occured uploading a map", "Please refer to the error code below.", operationMessage);
		}
	}

	async function submitMap() {
		const name = mapName;
		const description = mapDescription;
		const id = localStorage.getItem("id");
		const category = categoryValue;

		if (!name || !description || !id || category == "none") return "All fields and a selected category are required.";
		if (!uploadMapDataValue?.trim() && !filePicker?.files?.[0]) {
			return "Please provide locations either as text or a file.";
		}

		try {
			const mapData = await combineMapData();
			const payload = { id, name, description, mapData, category };

			const response = await fetch($apiUrl + "/maps", {
				method: "POST",
				headers: {
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (response.ok) {
				return `Map submitted successfully!`; // Must include "success"!
			} else {
				let resultErrors = "";
				result.errors?.forEach((e) => (resultErrors += e.msg + " "));
				if (result.error) resultErrors += result.error;
				console.error("Error(s) occured trying to submit a map: " + resultErrors);
				return resultErrors || "Failed to submit map.";
			}
		} catch (error) {
			console.error("Error submitting map:", error);
			return "Error submitting map: " + error;
		}
	}
</script>

<svelte:head>
	<title>Create map</title>
</svelte:head>

<Popup verySlim={true} bind:open={jsonPopup}>
	<h1 class="popup-title">JSON format</h1>
	<p>OpenGuessr uses a JSON format to load its locations. Here is an example of how that looks like.</p>
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
</Popup>

<div class="pageContainer">
	<div class="headerContainer">
		<h1 class="header">Create a map</h1>
	</div>

	<div class="formLayout">
		<!-- Left column: Settings -->
		<div class="formColumn">
			<div class="formSection">
				<h3 class="sectionTitle">Details</h3>
				<div class="fieldGroup">
					<p class="fieldLabel">Name</p>
					<input bind:value={mapName} type="text" placeholder="My map" maxlength="25" />
				</div>
				<div class="fieldGroup">
					<p class="fieldLabel">Category</p>
					<select class="standardButton white largeButton categoryDropdown" bind:value={categoryValue}>
						<option value="none">Click to select</option>
						<option value="Nature">Nature</option>
						<option value="Architecture">Architecture</option>
						<option value="Urban">Urban</option>
						<option value="Regions">Regions</option>
						<option value="Sports">Sports</option>
						<option value="Transport">Transport</option>
						<option value="Miscellaneous">Miscellaneous</option>
					</select>
				</div>
				<div class="fieldGroup">
					<p class="fieldLabel">Description</p>
					<input bind:value={mapDescription} type="text" placeholder="This map features..." maxlength="300" />
				</div>
			</div>

			<div class="formSection">
				<h3 class="sectionTitle">Locations (JSON)</h3>
				<div class="locationInstructions">
					<p>
						You can generate a map using a tool like Map-Generator and then convert it to the
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span
							class="jsonLink"
							role="tooltip"
							onclick={() => {
								jsonPopup = true;
							}}>OpenGuessr JSON format</span
						>. Check out the official converter
						<a target="_blank" href="https://education.openguessr.com/tools/map-converter">here</a>.
					</p>
				</div>
				<button
					class="standardButton white largeButton uploadButton"
					onclick={() => {
						playSound("basic_button");
						filePicker.click();
					}}
				>
					<Upload size={20} strokeWidth={2.25} />
					<input
						type="file"
						bind:this={filePicker}
						accept="application/json"
						onchange={(event) => {
							fileName = event.target.files.length > 0 ? event.target.files[0].name : "Pick file";
						}}
					/>
					<span>{fileName}</span>
				</button>
			</div>

			<Drawer title="Rules" inPage={true} hasBottomLayoutMargin={false}>
				<div class="locationInstructions">
					<ul>
						<li>You can only upload max. 3 maps per day</li>
						<li>Maps must at least have 50 unique locations</li>
						<li>Ensure that your map names and author names are family-friendly</li>
						<li>Keep all details in English</li>
						<li>Pick a descriptive map name (e.g. not "My Map")</li>
						<li>A maximum of 2,000 locations is recommended, up to 15,000 are possible</li>
					</ul>
				</div>
			</Drawer>
		</div>

		<!-- Right column: Locations -->
		<div class="formColumn locationsColumn">
			<div class="formSection locationsSection">
				<h3 class="sectionTitle sectionTitleMargin">Locations (Links)</h3>
				<div class="locationInstructions">
					<p class="instructionsTitle">Instructions</p>
					<ol>
						<li>Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer</li>
						<li>Drag the orange figure onto the map to open a streetview</li>
						<li>Copy the URL from the address bar into the textbox</li>
					</ol>
				</div>
				<p class="fieldLabel">Street View URLs</p>
				<div class="textAreaBox">
					<textarea
						bind:value={uploadMapDataValue}
						class="of-top of-bottom"
						rows="5"
						placeholder="https://www.google.com/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=..."
					></textarea>
				</div>
			</div>
		</div>
	</div>

	<div class="submitArea barMenu">
		<button
			class="standardButton largeButton"
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
</div>

<style>
	.pageContainer {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		padding-bottom: 50px;
	}

	.sectionTitle {
		margin-left: var(--content-margin);
	}

	.sectionTitleMargin {
		margin-bottom: var(--content-margin);
	}

	.formLayout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--layout-margin);
		width: 100%;
	}

	.formColumn {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
	}

	.formSection {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.fieldGroup {
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
	}

	.fieldLabel {
		opacity: 0.75;
		margin-top: var(--content-margin);
		margin-left: var(--content-margin);
		margin-bottom: 3px;
	}

	.fieldGroup input {
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
	}

	.categoryDropdown {
		width: 100%;
		justify-content: flex-start;
	}

	select option {
		background-color: rgb(74, 74, 74);
		color: white;
	}

	.jsonLink {
		text-decoration: underline;
		cursor: pointer;
	}

	.uploadButton {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		width: 100%;
		justify-content: center;
	}

	.uploadButton input {
		display: none;
	}

	ul:first-child {
		margin-top: var(--content-margin);
	}

	.locationsSection {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.locationInstructions {
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-shadow: var(--box-shadow);
	}

	.locationInstructions p {
		opacity: 0.75;
	}

	.instructionsTitle {
		margin-bottom: var(--box-margin);
		opacity: 1 !important;
	}

	.locationInstructions li {
		opacity: 0.75;
	}

	textarea {
		padding: var(--layout-margin);
		min-height: 100%;
		width: 100%;
	}

	.textAreaBox {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		overflow: hidden;
		min-height: 200px;
		flex-grow: 1;
	}

	.submitArea {
		margin-top: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--layout-margin);
	}

	.submitArea button {
		padding-inline: 30px;
	}

	/* Popup styles */
	.preBox {
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	pre {
		font-family: monospace;
		white-space: pre-wrap;
		color: white;
	}

	@media (max-width: 1300px) {
		.formLayout {
			grid-template-columns: 1fr;
		}

		.locationsColumn {
			order: 1;
		}
	}
</style>