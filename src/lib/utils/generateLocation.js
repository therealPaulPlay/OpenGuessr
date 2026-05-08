// This generates a new location, but keep in mind that this is NOT the function to present the user with a new location! This does not check the selected map etc.
import { getLocationCoordinates } from '$lib/logic/locationGeneration';
import { countryGuessr, imageGuessr } from "$lib/stores/modeStore";
import { currentLocationHeading, currentLocationLatitude, currentLocationLongitude } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuessrFunctions';
import { loadImageFromUrl } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';
import { resetMap } from '$lib/logic/miniMap';
import { resultScreenEnabled } from '$lib/stores/context-specific/resultScreenStore';
import { errorPopup } from './errorHandling';

// Load new location for a new panorama (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------
export async function generateNewLocation(type) {
    try {
        const newLocationArray = await getLocationCoordinates(type);

        // Set coordinates
        currentLocationLatitude.set(Number(newLocationArray[0]));
        currentLocationLongitude.set(Number(newLocationArray[1]));

        // Set heading if available, otherwise reset
        currentLocationHeading.set(newLocationArray[2]?.heading ?? null);

        // Set country
        if (get(countryGuessr)) setCountryGuesserCountry(newLocationArray[2]?.country);

        // Set image
        if (get(imageGuessr)) loadImageFromUrl(newLocationArray[2]?.imageUrl);

    } catch (error) {
        console.error("Failed to generate new location, the coordinates are not defined:", error);
        errorPopup("Error loading locations", "Failed to retrieve locations from the server.", error.message);
    }

    if (!get(resultScreenEnabled)) resetMap(); // Reset minimap & re-adjust to potentially new map (only if result screen isn't enabled, since that'd clear it)
}