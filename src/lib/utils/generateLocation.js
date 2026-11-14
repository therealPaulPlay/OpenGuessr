// This generates a new location, but keep in mind that this is NOT the function to present the user with a new location! This does not check the selected map etc.
import { getLocationCoordinates } from '$lib/utils/getLocationCoordinates';
import { countryGuessr, imageGuessr, metaGuessr } from "$lib/stores/modeStore";
import { currentLocationHeading, currentLocationLatitude, currentLocationLongitude, currentLocationPanoramaId, currentLocationPitch } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuessrFunctions';
import { setImageGuessrImage } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';
import { resetMapView } from '$lib/logic/miniMap';
import { resultScreenEnabled } from '$lib/stores/context-specific/resultScreenStore';
import { showErrorPopup } from "openguessr-ui";
import { setMetaGuessrMeta } from './metaGuessrFunctions';
import { MAP_SIZE_TRANSITION_DURATION } from '$lib/components/Map.svelte';

// Load new location for a new panorama (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------
export async function generateNewLocation(type) {
    try {
        const newLocationArray = await getLocationCoordinates(type);

        // Guard against missing coords (since Number() turns them into 0)
        if (newLocationArray?.[0] == null || newLocationArray?.[1] == null) throw new Error("One or both coordinates are null or undefined!");

        // Set coordinates
        currentLocationLatitude.set(Number(newLocationArray[0]));
        currentLocationLongitude.set(Number(newLocationArray[1]));

        // Optional location values, set if present, otherwise reset
        currentLocationHeading.set(newLocationArray[2]?.heading ?? null);
        currentLocationPitch.set(newLocationArray[2]?.pitch ?? null);
        currentLocationPanoramaId.set(newLocationArray[2]?.panoramaId ?? null);

        // Special-mode specific
        if (get(countryGuessr)) setCountryGuesserCountry(newLocationArray[2]?.country); // Set country
        if (get(imageGuessr)) setImageGuessrImage(newLocationArray[2]?.imageUrl); // Set image
        if (get(metaGuessr)) setMetaGuessrMeta(newLocationArray[2]?.meta); // Set meta

    } catch (error) {
        console.error("Failed to generate new location, the coordinates are not defined:", error);
        showErrorPopup("Error loading locations", "Failed to retrieve locations from the server.", error.message);
    }

    // Delayed since the resetting during the map size transition from result map to mini map shifts the view unexpectedly
    setTimeout(() => {
        if (!get(resultScreenEnabled)) resetMapView();
    }, MAP_SIZE_TRANSITION_DURATION);
}