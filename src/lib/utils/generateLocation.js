// This generates a new location, but keep in mind that this is NOT the function to present the user with a new location! This does not check the selected map etc.
import { getLocationCoordinates } from '$lib/logic/locationGeneration';
import { countryGuessr, imageGuessr, metaGuessr } from "$lib/stores/modeStore";
import { currentLocationHeading, currentLocationLatitude, currentLocationLongitude, currentLocationPanoramaId } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuessrFunctions';
import { setImageGuessrImage } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';
import { resetMap } from '$lib/logic/miniMap';
import { resultScreenEnabled } from '$lib/stores/context-specific/resultScreenStore';
import { errorPopup } from './errorHandling';
import { setMetaGuessrMeta } from './metaGuessrFunctions';

// Load new location for a new panorama (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------
export async function generateNewLocation(type) {
    try {
        const newLocationArray = await getLocationCoordinates(type);

        // Guard against missing coords (since Number() turns them into 0)
        if (newLocationArray?.[0] == null || newLocationArray?.[1] == null) throw new Error("One or both coordinates are null or undefined!");

        // Set coordinates
        currentLocationLatitude.set(Number(newLocationArray[0]));
        currentLocationLongitude.set(Number(newLocationArray[1]));

        // Set heading if available, otherwise reset
        currentLocationHeading.set(newLocationArray[2]?.heading ?? null);

        // Set panorama ID if available, otherwise reset
        currentLocationPanoramaId.set(newLocationArray[2]?.panoramaId ?? null);

        // Special-mode specific
        if (get(countryGuessr)) setCountryGuesserCountry(newLocationArray[2]?.country); // Set country
        if (get(imageGuessr)) setImageGuessrImage(newLocationArray[2]?.imageUrl); // Set image
        if (get(metaGuessr)) setMetaGuessrMeta(newLocationArray[2]?.meta); // Set meta

    } catch (error) {
        console.error("Failed to generate new location, the coordinates are not defined:", error);
        errorPopup("Error loading locations", "Failed to retrieve locations from the server.", error.message);
    }

    if (!get(resultScreenEnabled)) resetMap(); // Reset minimap & re-adjust to potentially new map (only if result screen isn't enabled, since that'd clear it)
}