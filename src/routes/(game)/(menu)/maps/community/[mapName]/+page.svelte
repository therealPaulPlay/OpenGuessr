<script>
	import { showProfile } from "$lib/utils/showProfile.js";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { showNotification } from "$lib/utils/notifications";
	import { changeMap } from "$lib/utils/changeMap.js";
	import {
		Link,
		MapPin,
		Heart,
		HeartOff,
		Trash2,
		Replace,
		Play,
		FileDown,
		Bookmark,
		BookmarkOff,
	} from "@lucide/svelte";
	import { playSound } from "$lib/utils/soundManager";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import { onMount, untrack } from "svelte";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore.js";
	import SvgMap from "$lib/components/SvgMap.svelte";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { tooltip } from "$lib/utils/tooltip.svelte.js";
	import { page } from "$app/state";
	import { navigationMenu } from "$lib/stores/uiStore.js";
	import { getMapsEmbedUrl } from "$lib/utils/streetViewUrl.js";

	let { data } = $props();

	let nameId = $derived(data.mapName.replaceAll("_", " ")); // Map name from URL used as identifier (lowercase)

	let map = $state(null);
	let mapLocationData = $derived(map?.map_data);
	let locationIndex = $state(0);

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
		locationsArrayForSvgMap?.[locationIndex]
			? getMapsEmbedUrl(
					locationsArrayForSvgMap?.[locationIndex]?.[0],
					locationsArrayForSvgMap?.[locationIndex]?.[1],
					locationsArrayForSvgMap?.[locationIndex]?.[2],
				)
			: null,
	);

	onMount(() => {
		playerId = localStorage.getItem("id");
	});

	onMount(async () => {
		try {
			const response = await fetch(get(apiUrl) + `/maps/${encodeURIComponent(nameId)}`);
			if (!response.ok) throw new Error(response.status);

			const mapData = await response.json();
			if (!mapData.map_data_url) throw new Error("Map data URL missing");

			const contentResponse = await fetch(mapData.map_data_url, { cache: "no-cache" });
			if (!contentResponse.ok) throw new Error(contentResponse.status);

			mapData.map_data = await contentResponse.json();
			map = mapData;
		} catch (error) {
			console.error("Error fetching map:", error);
			errorPopup("Map failed to load", "An error occured trying to load the map.", error.message);
		}
	});

	// Bookmark map ---------------------------------------
	let isBookmarked = $state(false);

	$effect(() => {
		if (!map?.name) return;
		untrack(() => {
			const addedCommunityMaps = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
			isBookmarked = addedCommunityMaps.includes(map?.name);
		});
	});

	// Like Functionality ------------------------------------------------------------------------------
	let isLiked = $state(false);
	let likesCount = $state("...");

	onMount(() => {
		fetchMapLikeStatus(nameId);
	});

	async function likeOrDislikeMap(mapName) {
		if (get(isAuthenticated)) {
			const previousLiked = isLiked;
			const previousCount = likesCount;

			isLiked = !isLiked;
			likesCount = Math.max(0, likesCount + (isLiked ? 1 : -1));

			try {
				const response = await fetch($apiUrl + `/maps/like/${mapName}`, {
					method: "POST",
					headers: {
						Authorization: "Bearer " + localStorage.getItem("bearer"),
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: localStorage.getItem("id") }),
				});

				if (!response.ok) {
					const data = await response.json().catch(() => {});
					throw new Error(data?.error || response.status);
				}
			} catch (error) {
				isLiked = previousLiked;
				likesCount = previousCount;
				console.error("Error liking or disliking map:", error);
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
				map = { ...map, map_data: { locations: finalLocations } };
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
	<title>{map?.name}</title>
</svelte:head>

<div class="main-container">
	<!-- Main View (Panorama Preview) -->
	<div class="map-view-iframe">
		{#if iframeSource}
			<!-- svelte-ignore a11y_missing_attribute -->
			<iframe class="map-iframe" referrerpolicy="no-referrer-when-downgrade" frameborder="0" src={iframeSource}
			></iframe>
		{:else}
			<p class="loading-text" style:opacity="0.5">Loading...</p>
		{/if}
	</div>
	<!-- Location Map (shows which spots are on the map)-->
	<div class="map-container">
		{#if mapLocationData?.locations?.length > 500}
			<div class="locations-trim-note">
				<p>Limited location view for performance.</p>
			</div>
		{/if}
		{#if locationsArrayForSvgMap?.length}
			<SvgMap
				locationList={locationsArrayForSvgMap}
				framePaddingOffset={{ top: 40 }}
				onclick={(coordinates) => {
					const mapLocations = $state.snapshot(locationsArrayForSvgMap);
					const index = mapLocations?.findIndex(([lat, lon]) => {
						return lat == coordinates.lat && lon == coordinates.lon;
					});
					if (index >= 0) locationIndex = index;
				}}
			/>
		{/if}
	</div>
	<!-- Author name and Like -->
	<div class="header-container">
		<div class="name-container">
			<h1 class="header map-title">{map?.name || "..."}</h1>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				class="author-text"
				style:pointer-events={map?.authorId == null ? "none" : undefined}
				onclick={() => {
					showProfile(map?.authorId);
				}}
			>
				by {map?.author || "..."}
			</p>
		</div>
		<div class="button-bar bar-menu">
			<div class="button-bar-inner of-left of-right">
				<button
					id="like-map"
					{@attach tooltip({ text: "Like" })}
					class="standard-button white map-button large-button"
					disabled={typeof likesCount !== "number"}
					onclick={() => {
						playSound("basic_button");
						likeOrDislikeMap(nameId);
					}}
				>
					{#if isLiked}
						<HeartOff strokeWidth={2.25} style="margin-top: 1px;" />
					{:else}
						<Heart strokeWidth={2.25} style="margin-top: 1px;" />
					{/if}
					<p id="likes-text">{likesCount ?? "Error"}</p>
				</button>
				<button
					{@attach tooltip({ text: "Save" })}
					class="standard-button white map-button large-button"
					onclick={() => {
						playSound("basic_button");

						// Add to or remove from bookmarks
						let addedCommunityMaps = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
						if (!addedCommunityMaps.includes(map?.name)) {
							addedCommunityMaps.push(map?.name);
							isBookmarked = true;
						} else {
							addedCommunityMaps = addedCommunityMaps.filter((mapName) => mapName !== map?.name);
							isBookmarked = false;
						}
						localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMaps));
					}}
				>
					{#if isBookmarked}
						<BookmarkOff strokeWidth={2.25} style="margin-top: 1px;" />
					{:else}
						<Bookmark strokeWidth={2.25} style="margin-top: 1px;" />
					{/if}
				</button>
				<button
					id="map-link"
					{@attach tooltip({ text: "Copy link" })}
					class="standard-button white map-button large-button"
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
					<Link strokeWidth={2.5} size={20} style="margin-top: 1px;" />
				</button>
				{#if map && map.authorId == playerId && playerId != null}
					<button
						id="manage-delete"
						{@attach tooltip({ text: "Delete" })}
						class="standard-button white map-button large-button"
						onclick={() => {
							playSound("basic_button");
							deleteMapScreen(map?.name);
						}}><Trash2 size={18} strokeWidth={2.75} /></button
					>
					<button
						id="manage-update"
						{@attach tooltip({ text: "Update" })}
						class="standard-button white map-button large-button"
						onclick={() => {
							playSound("basic_button");
							fileName = "Pick file"; // Reset file name input
							updatePopup = true;
							showStatus = false;
						}}><Replace size={18} strokeWidth={2.75} /></button
					>
					<a
						id="manage-download"
						{@attach tooltip({ text: "Download" })}
						class="standard-button white map-button large-button"
						href={mapDownloadHref}
						download={`${map?.name}.json`}
						onclick={() => playSound("basic_button")}><FileDown size={18} strokeWidth={2.5} /></a
					>
				{/if}
				<button
					class="standard-button map-button large-button"
					onclick={() => {
						playSound("basic_button");
						if (!map) return showNotification("Map not loaded yet, please try again.");

						// Change to map
						changeMap("community_" + map?.name, true, returnAfterChange);
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
	</div>

	<!-- Info boxes -->
	<div class="information">
		<div class="location-amount-info info-element">
			<div class="pin-icon-container">
				<MapPin size={100} strokeWidth={0.75} />
			</div>
			<p class="location-amount-text">{mapLocationData?.locations?.length?.toLocaleString() || "..."} Locations</p>
		</div>
		<div class="description-info info-element">
			<div class="description-scroll of-top of-bottom">
				<h3 class="desc-header">About</h3>
				<p>
					{map?.description || "..."}
				</p>
			</div>
		</div>
	</div>
</div>

<Popup bind:open={updatePopup} verySlim={true}>
	<div class="popup-title">
		<h1 id="map-update-header">Update locations</h1>
	</div>
	<p class="margin-bottom">Mode</p>
	<Tabs
		tabs={["Overwrite all", "Add"]}
		onchange={(_, tabIndex) => {
			playSound("basic_button");
			addInsteadOfOverwrite = tabIndex != 0;
		}}
	/>
	<p class="margin-top">Locations (Links)</p>
	<div class="textarea-container">
		<textarea
			type="text"
			class="of-top of-bottom"
			rows="10"
			bind:value={textareaValue}
			placeholder="https://www.google.com/maps..."></textarea>
	</div>
	<p class="margin-bottom">Locations (JSON)</p>
	<button
		class="standard-button white"
		onclick={() => {
			playSound("basic_button");
			filePicker.click(); // Simulate click on filePicker to make the file picker UI nicer (default picker is hidden)
		}}
	>
		<input
			type="file"
			id="json-update"
			accept="application/json"
			bind:this={filePicker}
			onchange={(e) => {
				fileName = e.target.files.length > 0 ? e.target.files[0].name : "Pick file";
			}}
		/>
		<p id="file-name-update">{fileName}</p>
	</button>
	{#if showStatus}
		<p class="margin-top" id="update-map-status">{statusText}</p>
	{/if}
	<div class="button-box-gap">
		<button
			id="update-proceed"
			class="standard-button bottom-button large-button"
			onclick={async () => {
				playSound("basic_button");
				showStatus = true;
				statusText = "Updating...";
				statusText = "Status: " + (await updateMap(map?.name));
			}}>Update</button
		>
	</div>
</Popup>

<style>
	.main-container {
		width: calc(100% - 20px);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		padding-inline: var(--box-margin);
	}

	.map-title {
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-container {
		width: 100%;
		height: 250px;
		max-height: 25svh;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		overflow: hidden;
		margin-bottom: var(--layout-spacer);
		position: relative;
	}

	.locations-trim-note {
		position: absolute;
		box-shadow: var(--box-shadow);
		bottom: var(--box-margin);
		left: var(--box-margin);
		max-width: calc(100% - 40px);
		border-radius: var(--content-margin);
		background-color: var(--box-color-dark-soft);
		backdrop-filter: blur(var(--normal-blur));
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		z-index: 10;
		pointer-events: none;
	}

	.button-box-gap {
		gap: var(--layout-margin);
	}

	.locations-trim-note p {
		opacity: 0.5;
		font-size: 20px;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.description-scroll {
		width: 100%;
		overflow-x: hidden;
		overflow-y: auto;
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		opacity: 0.5;
		scrollbar-width: none;
	}

	.desc-header {
		margin-bottom: var(--box-margin);
	}

	.margin-top {
		margin-top: 20px;
	}

	.margin-bottom {
		margin-bottom: var(--box-margin);
	}

	#update-map-status {
		background-color: var(--box-color);
		padding: var(--content-margin);
		border-radius: var(--box-margin);
		padding-inline: var(--layout-margin);
		width: calc(100% - 30px);
	}

	.info-element {
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
		display: flex;
		padding: var(--box-margin);
		flex-grow: 1;
		height: 200px;
		min-width: 25%;
		color: white;
	}

	.pin-icon-container {
		opacity: 0.5;
	}

	.location-amount-text {
		opacity: 0.5;
	}

	textarea {
		width: 100%;
		min-height: 100%;
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
	}

	.textarea-container {
		border-radius: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: var(--layout-margin);
		margin-top: var(--layout-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		overflow: hidden;
	}

	.location-amount-info {
		justify-content: center;
		align-items: center;
		flex-direction: column;
		gap: var(--layout-margin);
	}

	.description-info {
		flex-grow: 4;
	}

	#json-update {
		display: none;
	}

	.information {
		width: 100%;
		display: flex;
		gap: var(--layout-margin);
		margin-top: var(--box-margin);
		margin-bottom: var(--layout-spacer);
	}

	.name-container {
		display: flex;
		max-width: 75%;
		align-items: center;
		flex-wrap: wrap;
	}

	.author-text {
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

	.author-text:hover {
		opacity: 0.25;
	}

	.map-view-iframe {
		width: 100%;
		height: 400px;
		max-height: 35svh;
		border-radius: var(--layout-margin);
		overflow: hidden;
		margin-bottom: calc(var(--layout-margin) * -2);
		position: relative;
		background-color: rgb(10, 10, 15);
		text-align: center;
		align-content: center;
		z-index: 10;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	.map-iframe {
		width: 100%;
		height: 100%;
	}

	#like-map {
		padding-inline: 12px;
		display: flex;
		gap: var(--box-margin);
		align-items: center;
		padding-bottom: var(--content-margin);
		padding-top: var(--content-margin);
	}

	.button-bar {
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		max-width: 100%;
	}

	.button-bar-inner {
		justify-content: safe center;
		align-items: safe center;
		overflow-x: auto;
		scrollbar-width: none;
		display: flex;
		gap: var(--panel-margin);
	}

	.map-button {
		justify-content: center;
		align-items: center;
		display: flex;
	}

	@media (max-width: 800px) and (orientation: portrait) {
		.information {
			flex-wrap: wrap;
		}

		.map-container {
			max-height: 20svh;
		}

		.map-view-iframe {
			max-height: 25svh;
		}
	}
</style>
