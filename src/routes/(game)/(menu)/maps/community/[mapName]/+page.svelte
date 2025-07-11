<script>
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { showNotification } from "$lib/utils/notifications";
	import { changeCategory } from "$lib/utils/changeCategory";
	import { Link, MapPin, Heart, HeartOff, Trash2, Replace, Play } from "lucide-svelte";
	import { playSound } from "$lib/utils/soundManager";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import { panoramaKey } from "$lib/stores/locationStore";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore.js";
	import SvgMap from "$lib/components/SvgMap.svelte";
	import Tabs from "$lib/components/ui/Tabs.svelte";

	let { data } = $props();

	let locationIndex = $state(0);
	let iframeSource = $derived(
		"https://www.google.com/maps/embed/v1/streetview?location=" +
			data.map_data.locations[locationIndex][0] +
			"," +
			data.map_data.locations[locationIndex][1] +
			"&key=" +
			get(panoramaKey) +
			"&fov=90",
	);
	let mapName = $state(data.name);
	let mapAuthor = $state(data.author);
	let mapAuthorId = $state(data.authorId);
	let mapDescription = $state(data.description);
	let mapLocationAmount = $state(data.map_data?.locations.length);
	let mapLocationData = $state(data.map_data);

	let playerId = $state(0);

	onMount(() => {
		playerId = localStorage.getItem("id");
	});

	// Like Functionality ------------------------------------------------------------------------------
	let isLiked = $state(false);
	let likesCount = $state("...");

	onMount(() => {
		fetchMapLikeStatus(mapName);
	});

	async function likeOrDislikeMap(mapName) {
		if (get(isAuthenticated)) {
			try {
				const response = await fetch($accountUrl + `/maps/like/${mapName}`, {
					method: "POST",
					headers: {
						Authorization: "Bearer " + localStorage.getItem("bearer"),
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: localStorage.getItem("id") }),
				});

				const data = await response.json();

				if (response.ok) {
					await fetchMapLikeStatus(mapName); // fetch new information
				} else {
					console.error("Error liking or disliking map:", data.error);
				}
			} catch (error) {
				console.error("Network error during like or dislike of map:", error);
			}
		} else {
			signupPrompt();
		}
	}

	async function fetchMapLikeStatus(name) {
		try {
			const playerId = localStorage.getItem("id") || null;

			const response = await fetch($accountUrl + `/maps/rating/${name}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: playerId }), // playerId is optional
			});

			const data = await response.json();

			if (response.ok) {
				likesCount = data.likeAmount;
				isLiked = data.liked;
			} else {
				throw new Error(data.error || response.status);
			}
		} catch (error) {
			console.error("Error loading like data:", error);
		}
	}

	// Map deletion -------------------------------------------------------------------------------------------------
	function deleteMapScreen(name) {
		showConfirmPopup("Delete map?", "Deleting a map cannot be undone.", () => {
			deleteMap(name);
		});
	}

	async function deleteMap(mapName) {
		// delete from database
		try {
			const body = {
				id: localStorage.getItem("id"), // for auth
			};

			// Send POST request to the server
			const response = await fetch($accountUrl + "/maps/" + mapName, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			// Return the success or error message. No need to parse the response
			if (response.ok) {
				showConfirmPopup("Map deleted", "The map was deleted successfully.", false, false, false, true);
				goto("/maps");
				return "Map deleted successfully.";
			} else {
				console.error("Error deleting map: " + response.status);
				errorPopup("Failed to delete map", "Failed to delete the map " + mapName + ".", response.status);
			}
		} catch (error) {
			console.error("Error deleting map:", error);
			errorPopup("Failed to delete map (Network)", "Failed to delete the map " + mapName + ".", error);
		}
	}

	// Map Update ---------------------------------------------------------------------------------------------------------
	let updatePopup = $state(false);
	let filePicker = $state();
	let fileName = $state("Pick file");
	let showStatus = $state(false);
	let statusText = $state("Default...");
	let textareaValue = $state();
	let addInsteadOfOverwrite = $state(false);

	async function combineUpdateData() {
		const locations = [];

		// Add locations from textarea
		if (textareaValue?.trim()) {
			const textLocations = extractCoordinates(textareaValue);
			locations.push(...JSON.parse(textLocations).locations);
		}

		// Add locations from file
		if (filePicker?.files?.[0]) {
			const fileLocations = await getJsonStringFromFile(filePicker.files[0]);
			locations.push(...JSON.parse(fileLocations).locations);
		}

		return locations;
	}

	async function updateMap(mapName) {
		try {
			const newLocations = await combineUpdateData();
			if (newLocations.length === 0) return "Please provide locations either as text or upload a file.";

			let finalLocations = newLocations;

			// If add instead of overwrite, combine with existing locations
			if (addInsteadOfOverwrite) {
				finalLocations = [...mapLocationData?.locations, ...newLocations];
			}

			const body = {
				id: localStorage.getItem("id"),
				name: mapName,
				mapData: JSON.stringify({ locations: finalLocations }),
			};

			// Send POST request to the server
			const response = await fetch($accountUrl + "/maps", {
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

	// SVG Map-related ---------------------------------------------------------------------------------------------------------------------
	let locationsArrayForSvgMap = $derived.by(() => {
		if (mapLocationData?.locations?.length > 500) {
			const originalLength = mapLocationData?.locations.length;
			const skipFactor = Math.ceil(originalLength / 500);
			return mapLocationData?.locations.filter((_, index) => index % skipFactor === 0);
		} else {
			return mapLocationData?.locations;
		}
	});

	// Calculate map center based on locations
	let mapCenter = $derived.by(() => {
		if (!locationsArrayForSvgMap || locationsArrayForSvgMap.length < 2) return;

		// Find bounds
		const bounds = locationsArrayForSvgMap.reduce(
			(acc, [lat, long]) => ({
				minLat: Math.min(acc.minLat, lat),
				maxLat: Math.max(acc.maxLat, lat),
				minLong: Math.min(acc.minLong, long),
				maxLong: Math.max(acc.maxLong, long),
			}),
			{ minLat: 90, maxLat: -90, minLong: 180, maxLong: -180 },
		);
		if (bounds.maxLong - bounds.minLong > 180 || bounds.maxLat - bounds.minLat > 90) return; // Use default if locations cover most of the world
		return {
			lat: (bounds.minLat + bounds.maxLat) / 2,
			long: (bounds.minLong + bounds.maxLong) / 2,
		};
	});
</script>

<svelte:head>
	<title>{mapName}</title>
</svelte:head>

<div class="mainContainer">
	<!-- Main View (Panorama Preview) -->
	<div class="mapViewIframe">
		<!-- svelte-ignore a11y_missing_attribute -->
		<iframe class="mapIframe" referrerpolicy="no-referrer-when-downgrade" frameborder="0" src={iframeSource}></iframe>
	</div>
	<!-- Location Map (shows which spots are on the map)-->
	{#if locationsArrayForSvgMap?.length}
		<div class="mapContainer">
			{#if mapLocationAmount > 500}
				<div class="locationsTrimNote">
					<p>Limited location view for performance.</p>
				</div>
			{/if}
			<SvgMap
				locationList={locationsArrayForSvgMap}
				zoom={1.25}
				center={mapCenter}
				onclick={(coordinates) => {
					const mapLocations = $state.snapshot(locationsArrayForSvgMap);
					const index = mapLocations?.findIndex(([lat, long]) => {
						return lat == coordinates.lat && long == coordinates.long;
					});
					if (index >= 0) locationIndex = index;
					console.log(index);
				}}
			/>
		</div>
	{/if}
	<!-- Author name and Like -->
	<div class="titleContainer">
		<div class="nameContainer">
			<h1 class="header mapTitle">{mapName}</h1>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				class="authorText"
				onclick={() => {
					loadProfileFromId(mapAuthorId, true);
				}}
			>
				by {mapAuthor}
			</p>
		</div>
		<div class="buttonBar">
			<button
				id="likeMap"
				class="standardButton white mapButton"
				onclick={() => {
					playSound("basic_button");
					likeOrDislikeMap(mapName);
				}}
			>
				{#if isLiked}
					<HeartOff strokeWidth={2.25} style="margin-top: 2px;" />
				{:else}
					<Heart strokeWidth={2.25} style="margin-top: 2px;" />
				{/if}
				<p id="likesText">{likesCount ?? "Error"}</p>
			</button>
			<button
				id="mapLink"
				class="standardButton white mapButton"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(window.location)
						.then(function () {
							showNotification("Copied!");
						})
						.catch(function (error) {
							showNotification("Error: " + error);
							console.error("Copy error: " + error);
						});
				}}
			>
				<Link strokeWidth={2.75} size={18} />
			</button>
			{#if mapAuthorId == playerId && playerId != null}
				<button
					id="manageDelete"
					class="standardButton white mapButton"
					onclick={() => {
						playSound("basic_button");
						deleteMapScreen(mapName);
					}}><Trash2 size={18} strokeWidth={2.75} /></button
				>
				<button
					id="manageUpdate"
					class="standardButton white mapButton"
					onclick={() => {
						playSound("basic_button");
						fileName = "Pick file"; // Reset file name input
						updatePopup = true;
						showStatus = false;
					}}><Replace size={18} strokeWidth={2.75} /></button
				>
			{/if}
			<button
				class="standardButton mapButton"
				onclick={() => {
					playSound("basic_button");
					let addedCommunityMaps = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
					if (!addedCommunityMaps.includes(mapName)) addedCommunityMaps.push(mapName);
					localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMaps));
					changeCategory("community_" + mapName.toLowerCase(), true);
					goto("/");
				}}
			>
				<Play strokeWidth={2.5} />
			</button>
		</div>
	</div>

	<!-- Info boxes -->
	<div class="information">
		<div class="locationAmountInfo infoElement">
			<div class="pinIconContainer">
				<MapPin size={100} strokeWidth={0.75} />
			</div>
			<p class="locationAmountText">{mapLocationAmount.toLocaleString()} Locations</p>
		</div>
		<div class="descriptionInfo infoElement">
			<div class="descriptionScroll of-top of-bottom">
				<h2 class="descHeader">About <i>{mapName}</i></h2>
				<p>
					{mapDescription}
				</p>
			</div>
		</div>
	</div>
</div>

<Popup bind:open={updatePopup}>
	<div class="popup-title">
		<h1 id="mapUpdateHeader">Update locations</h1>
	</div>
	<p class="marginBottom">Locations:</p>
	<Tabs
		tabs={["Overwrite all", "Add"]}
		onchange={(_, tabIndex) => {
			playSound("basic_button");
			addInsteadOfOverwrite = tabIndex != 0;
		}}
	/>
	<textarea
		id="updateMapData"
		class="uploadInfo"
		type="text"
		rows="20"
		bind:value={textareaValue}
		placeholder="https://www.google.com/maps..."
	></textarea>
	<p>...or upload a JSON in the OpenGuessr format:</p>
	<button
		id="jsonUpdateButton"
		class="standardButton white"
		onclick={() => {
			playSound("basic_button");
			filePicker.click(); // Simulate click on filePicker to make the file picker UI nicer (default picker is hidden)
		}}
	>
		<input
			type="file"
			id="jsonUpdate"
			accept="application/json"
			bind:this={filePicker}
			onchange={(e) => {
				fileName = e.target.files.length > 0 ? e.target.files[0].name : "Pick file";
			}}
		/>
		<p id="fileNameUpdate">{fileName}</p>
	</button>
	{#if showStatus}
		<p class="marginTop" id="updateMapStatus">{statusText}</p>
	{/if}
	<div class="buttonBoxGap">
		<button
			id="updateProceed"
			class="standardButton largeButton"
			onclick={async () => {
				playSound("basic_button");
				showStatus = true;
				statusText = "Updating...";
				statusText = "Status: " + (await updateMap(mapName));
			}}>Update</button
		>
	</div>
</Popup>

<style>
	.mainContainer {
		width: calc(100% - 20px);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		padding-inline: 10px;
	}

	.mapTitle {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mapContainer {
		width: 100%;
		height: 250px;
		max-height: 25dvh;
		border-radius: 15px;
		background-color: var(--box-color);
		overflow: hidden;
		margin-bottom: 50px;
		position: relative;
	}

	.locationsTrimNote {
		position: absolute;
		box-shadow: var(--box-shadow);
		bottom: var(--box-margin);
		left: var(--box-margin);
		max-width: calc(100% - 40px);
		border-radius: 5px;
		background-color: var(--dark-background);
		backdrop-filter: blur(10px);
		padding: 5px;
		padding-inline: var(--box-margin);
		z-index: 10;
		pointer-events: none;
	}

	.buttonBoxGap {
		gap: var(--layout-margin);
	}

	.locationsTrimNote p {
		opacity: 0.5;
		font-size: 20px;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.descriptionScroll {
		width: 100%;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 5px;
		padding-inline: 10px;
		opacity: 0.5;
	}

	.descHeader {
		font-size: 25px;
		margin-bottom: 10px;
	}

	.marginTop {
		margin-top: 20px;
	}

	.marginBottom {
		margin-bottom: var(--box-margin);
	}

	#updateMapStatus {
		background-color: var(--box-color);
		padding: 5px;
		border-radius: 10px;
		padding-inline: 15px;
		width: calc(100% - 30px);
	}

	.infoElement {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: 15px;
		display: flex;
		padding: var(--box-margin);
		flex-grow: 1;
		height: 200px;
		min-width: 25%;
		color: white;
	}

	.pinIconContainer {
		opacity: 0.5;
	}

	.locationAmountText {
		opacity: 0.5;
	}

	.uploadInfo {
		border-radius: 10px;
		width: calc(100% - 40px);
		font-size: 16px;
		padding: var(--box-margin);
		padding-inline: 20px;
		margin-bottom: var(--layout-margin);
		margin-top: var(--box-margin);
		transition: background-color 250ms ease;
		color: white;
	}

	#jsonUpdateButton {
		margin-top: 10px;
	}

	.locationAmountInfo {
		justify-content: center;
		align-items: center;
		flex-direction: column;
		gap: 15px;
	}

	.descriptionInfo {
		flex-grow: 4;
	}

	#jsonUpdate {
		display: none;
	}

	.information {
		width: 100%;
		display: flex;
		gap: var(--layout-margin);
		margin-top: var(--layout-margin);
		margin-bottom: 50px;
	}

	.nameContainer {
		display: flex;
		max-width: 75%;
		align-items: center;
		flex-wrap: wrap;
	}

	.titleContainer {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		margin-bottom: 5px;
	}

	.authorText {
		text-align: left;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		overflow: hidden;
		opacity: 0.5;
		width: fit-content;
		width: 100%;
		cursor: pointer;
		transition: opacity 250ms ease;
	}

	.authorText:hover {
		opacity: 0.25;
	}

	.mapViewIframe {
		width: 100%;
		height: 400px;
		max-height: 35dvh;
		border-radius: 15px;
		overflow: hidden;
		margin-bottom: calc(var(--layout-margin) * -2);
		position: relative;
		background-color: rgb(27, 27, 37);
		z-index: 10;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	.mapIframe {
		width: 100%;
		height: 100%;
	}

	#likeMap {
		padding-inline: 12px;
		display: flex;
		gap: var(--box-margin);
		align-items: center;
		padding-bottom: 5px;
		padding-top: 5px;
	}

	.buttonBar {
		display: flex;
		gap: var(--layout-margin);
		justify-content: safe center;
		align-items: safe center;
		max-width: 100%;
		overflow: auto;
	}

	.mapButton {
		min-height: 50px;
		border-radius: 10px;
		justify-content: center;
		align-items: center;
		display: flex;
	}

	@media (max-width: 800px) {
		.information {
			flex-wrap: wrap;
		}
	}
</style>
