<script>
	import { showProfile } from "$lib/utils/showProfile.js";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { showNotification } from "$lib/utils/notifications";
	import { changeMap } from "$lib/utils/changeMap.js";
	import { Link, MapPin, Heart, HeartOff, Trash2, Replace, Play, FileDown } from "@lucide/svelte";
	import { playSound } from "$lib/utils/soundManager";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import { panoramaKey, streetViewURLPrefix } from "$lib/stores/locationStore";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore.js";
	import SvgMap from "$lib/components/SvgMap.svelte";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { tooltip } from "$lib/utils/tooltip.svelte.js";
	import { page } from "$app/state";
	import { navigationMenu } from "$lib/stores/uiStore.js";

	let { data } = $props();

	let locationIndex = $state(0);
	let mapName = $derived(data.name);
	let mapAuthor = $derived(data.author);
	let mapAuthorId = $derived(data.authorId);
	let mapDescription = $derived(data.description);
	let mapLocationAmount = $derived(data.map_data?.locations.length);
	let mapLocationData = $derived(data.map_data);

	let playerId = $state(0);
	let returnAfterChange = $derived(page.url.searchParams.get("return-to-multiplayer"));

	let locationsArrayForSvgMap = $derived.by(() => {
		if (mapLocationData?.locations?.length > 500) {
			const originalLength = mapLocationData?.locations.length;
			const skipFactor = Math.ceil(originalLength / 500);
			return mapLocationData?.locations.filter((_, index) => index % skipFactor === 0);
		} else return mapLocationData?.locations;
	});

	let iframeSource = $derived(
		$streetViewURLPrefix +
			locationsArrayForSvgMap?.[locationIndex]?.[0] +
			"," +
			locationsArrayForSvgMap?.[locationIndex]?.[1] +
			"&key=" +
			get(panoramaKey) +
			"&fov=90",
	);

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
				const response = await fetch($apiUrl + `/maps/like/${mapName}`, {
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
			const playerId = localStorage.getItem("id");

			const response = await fetch($apiUrl + `/maps/rating/${name}`, {
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
			const response = await fetch($apiUrl + "/maps/" + mapName, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			// Return the success or error message. No need to parse the response
			if (response.ok) {
				showConfirmPopup("Map deleted", "The map was deleted successfully.");
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
			if (addInsteadOfOverwrite) finalLocations = [...(mapLocationData?.locations || []), ...newLocations];

			const body = {
				id: localStorage.getItem("id"),
				name: mapName,
				mapData: JSON.stringify({ locations: finalLocations }),
			};

			// Send POST request to the server
			const response = await fetch($apiUrl + "/maps", {
				method: "PUT",
				headers: {
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			// Return the success or error message. No need to parse the response
			if (response.ok) {
				// Update local copy so subsequent adds use the latest locations
				data = { ...data, map_data: { locations: finalLocations } };
				return `Map updated successfully.`;
			} else {
				let error = response.status;

				// Try extract error
				try {
					const jsonResponse = await response.json();
					if (jsonResponse.error) error = jsonResponse.error;
				} catch {}

				console.error("Error updating map: " + error);
				return "Failed to update map: " + error;
			}
		} catch (error) {
			console.error("Error updating map:", error);
			return "A network error occurred while updating the map: " + error;
		}
	}

	// Map download -------------------------------------------------------------------------------------------------------------------------
	let mapDownloadHref = $derived(
		"data:application/json;charset=utf-8," +
			encodeURIComponent(JSON.stringify({ locations: mapLocationData?.locations ?? [] }, null, 2)),
	);
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
				framePaddingOffset={{ top: 40 }}
				class="mapBulbShadow"
				onclick={(coordinates) => {
					const mapLocations = $state.snapshot(locationsArrayForSvgMap);
					const index = mapLocations?.findIndex(([lat, lon]) => {
						return lat == coordinates.lat && lon == coordinates.lon;
					});
					if (index >= 0) locationIndex = index;
				}}
			/>
		</div>
	{/if}
	<!-- Author name and Like -->
	<div class="headerContainer">
		<div class="nameContainer">
			<h1 class="header mapTitle">{mapName}</h1>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				class="authorText"
				onclick={() => {
					showProfile(mapAuthorId);
				}}
			>
				by {mapAuthor}
			</p>
		</div>
		<div class="buttonBar barMenu of-left of-right">
			<button
				id="likeMap"
				{@attach tooltip({ text: "Like" })}
				class="standardButton white mapButton largeButton"
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
				{@attach tooltip({ text: "Copy link" })}
				class="standardButton white mapButton largeButton"
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
					{@attach tooltip({ text: "Delete" })}
					class="standardButton white mapButton largeButton"
					onclick={() => {
						playSound("basic_button");
						deleteMapScreen(mapName);
					}}><Trash2 size={18} strokeWidth={2.75} /></button
				>
				<button
					id="manageUpdate"
					{@attach tooltip({ text: "Update" })}
					class="standardButton white mapButton largeButton"
					onclick={() => {
						playSound("basic_button");
						fileName = "Pick file"; // Reset file name input
						updatePopup = true;
						showStatus = false;
					}}><Replace size={18} strokeWidth={2.75} /></button
				>
				<a
					id="manageDownload"
					{@attach tooltip({ text: "Download" })}
					class="standardButton white mapButton largeButton"
					href={mapDownloadHref}
					download={`${mapName}.json`}
					onclick={() => playSound("basic_button")}><FileDown size={18} strokeWidth={2.5} /></a
				>
			{/if}
			<button
				class="standardButton mapButton largeButton"
				{@attach tooltip({ text: "Play" })}
				onclick={() => {
					playSound("basic_button");

					// Add to bookmarked community maps
					let addedCommunityMaps = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
					if (!addedCommunityMaps.includes(mapName)) addedCommunityMaps.push(mapName);
					localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMaps));

					// Change to map
					changeMap("community_" + mapName, true, returnAfterChange);
					if (!returnAfterChange) {
						navigationMenu.set(false);
						goto("/");
					}
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

<Popup bind:open={updatePopup} verySlim={true}>
	<div class="popup-title">
		<h1 id="mapUpdateHeader">Update locations</h1>
	</div>
	<p class="marginBottom">Mode</p>
	<Tabs
		tabs={["Overwrite all", "Add"]}
		onchange={(_, tabIndex) => {
			playSound("basic_button");
			addInsteadOfOverwrite = tabIndex != 0;
		}}
	/>
	<p class="marginTop">Locations (Links)</p>
	<div class="textareaContainer">
		<textarea
			type="text"
			class="of-top of-bottom"
			rows="10"
			bind:value={textareaValue}
			placeholder="https://www.google.com/maps..."
		></textarea>
	</div>
	<p class="marginBottom">Locations (JSON)</p>
	<button
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
			class="standardButton bottomButton largeButton"
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
		padding-inline: var(--box-margin);
	}

	.mapTitle {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mapContainer {
		width: 100%;
		height: 250px;
		max-height: 25svh;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		overflow: hidden;
		margin-bottom: 50px;
		position: relative;
	}

	:global(.mapBulbShadow) {
		box-shadow: var(--bulb-shadow);
	}

	.locationsTrimNote {
		position: absolute;
		box-shadow: var(--box-shadow);
		bottom: var(--box-margin);
		left: var(--box-margin);
		max-width: calc(100% - 40px);
		border-radius: var(--content-margin);
		background-color: var(--dark-background);
		backdrop-filter: blur(10px);
		padding: var(--content-margin);
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
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		opacity: 0.5;
		scrollbar-width: none;
	}

	.descHeader {
		font-size: 25px;
		margin-bottom: var(--box-margin);
	}

	.marginTop {
		margin-top: 20px;
	}

	.marginBottom {
		margin-bottom: var(--box-margin);
	}

	#updateMapStatus {
		background-color: var(--box-color);
		padding: var(--content-margin);
		border-radius: var(--box-margin);
		padding-inline: var(--layout-margin);
		width: calc(100% - 30px);
	}

	.infoElement {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--layout-margin);
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

	textarea {
		width: 100%;
		min-height: 100%;
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
	}

	.textareaContainer {
		border-radius: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: var(--layout-margin);
		margin-top: var(--layout-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		overflow: hidden;
	}

	.locationAmountInfo {
		justify-content: center;
		align-items: center;
		flex-direction: column;
		gap: var(--layout-margin);
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
		margin-top: var(--box-margin);
		margin-bottom: 50px;
	}

	.nameContainer {
		display: flex;
		max-width: 75%;
		align-items: center;
		flex-wrap: wrap;
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
		max-height: 35svh;
		border-radius: var(--layout-margin);
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
		padding-bottom: var(--content-margin);
		padding-top: var(--content-margin);
	}

	.buttonBar {
		box-shadow: var(--box-shadow);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		justify-content: safe center;
		align-items: safe center;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.mapButton {
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
