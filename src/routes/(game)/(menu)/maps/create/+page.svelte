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
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";

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
		const submitMap = async () => {
			const name = mapName;
			const description = mapDescription;
			const id = localStorage.getItem("id");
			const category = categoryValue;

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
					return "Map submitted successfully!"; // Must include "success"
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
		};

		const operationMessage = await submitMap();
		if (operationMessage.includes("success")) {
			goto("/maps/community/" + mapName.replaceAll(" ", "_").toLowerCase());
			showNotification("Map created!");
		} else {
			errorPopup("Error occured uploading a map", "Please refer to the error code below.", operationMessage);
		}
	}
</script>

<svelte:head>
	<title>Create map</title>
</svelte:head>

<Popup slim={true} bind:open={jsonPopup}>
	<h1 class="popup-title">JSON format</h1>
	<p>OpenGuessr uses a JSON format to load its locations, an example of which can be seen in the snippet below.</p>
	<br />
	<p>
		The third and optional entry in the coordinate array is an object with data about the location. Specifically, the
		heading, pitch, and the panorama ID.
	</p>
	<br />
	<div class="pre-box">
		<pre>
&lbrace;
  "locations": [
    [latitude, longitude],
    [latitude, longitude, &lbrace;"heading": 110&rbrace;],
    ...
    [latitude, longitude, &lbrace;"heading": 50, "pitch": 15, "panoramaId": "mSQcVfwDD..."&rbrace;]
  ]
&rbrace;</pre>
	</div>
</Popup>

<div class="main-container">
	<div class="content-area">
		<div class="form-layout">
			<!-- Left column: Settings -->
			<div class="form-column">
				<div class="form-section">
					<h3 class="section-title">Details</h3>
					<div class="field-group">
						<p class="field-label">Name</p>
						<input bind:value={mapName} type="text" placeholder="My map" maxlength="25" />
					</div>
					<div class="field-group">
						<p class="field-label">Category</p>
						<select
							class="standard-button white large-button category-dropdown"
							bind:value={categoryValue}
							onchange={() => {
								playSound("basic_button");
							}}
						>
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
					<div class="field-group">
						<p class="field-label">Description</p>
						<input bind:value={mapDescription} type="text" placeholder="This map features..." maxlength="300" />
					</div>
				</div>

				<Drawer title="Rules" hasBottomLayoutMargin={false}>
					<div class="location-instructions">
						<ul>
							<li>You are limited to 3 maps per day</li>
							<li>Maps must have 50 or more unique locations</li>
							<li>Ensure the map name is family-friendly</li>
							<li>Keep all details in English</li>
							<li>Pick a descriptive map name (e.g. not "My Map")</li>
							<li>A maximum of 2,000 locations is recommended, up to 15,000 are possible</li>
						</ul>
					</div>
				</Drawer>

				<div class="form-section">
					<h3 class="section-title">Locations (JSON)</h3>
					<div class="location-instructions">
						<p>
							You can generate a map using a tool like Map-Generator and then convert it to the
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<span
								class="json-link"
								role="tooltip"
								onclick={() => {
									jsonPopup = true;
								}}>OpenGuessr JSON format</span
							>. Check out the official converter
							<a target="_blank" href="https://education.openguessr.com/tools/map-converter">here</a>.
						</p>
					</div>
					<button
						class="standard-button white large-button upload-button"
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
			</div>

			<!-- Right column: Locations -->
			<div class="form-column locations-column">
				<div class="form-section locations-section">
					<h3 class="section-title section-title-margin">Locations (Links)</h3>
					<div class="location-instructions">
						<ol>
							<li>
								Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer
							</li>
							<li>Drag the orange figure onto the map to open a streetview</li>
							<li>Copy the URL from the address bar into the textbox</li>
						</ol>
					</div>
					<p class="field-label">Street View URLs</p>
					<div class="text-area-box">
						<textarea
							bind:value={uploadMapDataValue}
							class="of-top of-bottom"
							rows="5"
							placeholder="https://www.google.com/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=..."></textarea>
					</div>
				</div>
			</div>
		</div>

		<div class="submit-area bar-menu">
			<button
				class="standard-button large-button"
				onclick={() => {
					playSound("basic_button");
					showConfirmPopup(
						"Submit?",
						"Your map will be live immediately. Violating the submission rules can result in a ban.",
						() => ($isAuthenticated ? uploadMap() : signupPrompt(uploadMap)),
					);
				}}>Submit</button
			>
		</div>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(100dvh - 120px);
	}

	.content-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 900px;
		margin-top: auto;
		margin-bottom: auto;
	}

	.section-title {
		margin-left: var(--content-margin);
	}

	.section-title-margin {
		margin-bottom: var(--content-margin);
	}

	.form-layout {
		display: grid;
		grid-template-columns: 3fr 4fr;
		gap: var(--layout-margin);
		width: 100%;
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
	}

	.form-section {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		box-shadow: var(--panel-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		overflow: hidden;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
		min-width: 0;
	}

	.field-label {
		opacity: 0.75;
		margin-top: var(--content-margin);
		margin-left: var(--content-margin);
		margin-bottom: 3px;
	}

	.field-group input {
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
	}

	.category-dropdown {
		width: 100%;
		justify-content: flex-start;
	}

	select option {
		background-color: rgb(74, 74, 74);
		color: white;
	}

	.json-link {
		text-decoration: underline;
		cursor: pointer;
	}

	.upload-button {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		width: 100%;
		justify-content: center;
	}

	.upload-button input {
		display: none;
	}

	.locations-section {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	ul,
	ol {
		margin-bottom: var(--content-margin);
		margin-top: var(--content-margin);
	}

	.location-instructions {
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-shadow: var(--box-shadow);
	}

	.location-instructions p {
		opacity: 0.75;
	}

	.location-instructions li {
		opacity: 0.75;
	}

	textarea {
		padding: var(--layout-margin);
		min-height: 100%;
		width: 100%;
	}

	.text-area-box {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		overflow: hidden;
		min-height: 200px;
		flex-grow: 1;
	}

	.submit-area {
		margin-top: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
	}

	.submit-area button {
		padding-inline: 30px;
	}

	/* Popup styles */
	.pre-box {
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
		.form-layout {
			grid-template-columns: 1fr;
		}

		.locations-column {
			order: 1;
		}
	}
</style>
