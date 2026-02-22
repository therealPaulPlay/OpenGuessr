// This generates a new location, but keep in mind that this is NOT the function to present the user with a new location! This does not check the selected map etc.
import { getLocationCoordinates } from '$lib/logic/locationGeneration';
import { countryGuessr, imageGuessr } from "$lib/stores/modeStore";
import { currentLocationLatitude, currentLocationLongitude } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuessrFunctions';
import { loadImageFromUrl } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';
import { resetMap } from '$lib/logic/miniMap';
import { resultScreenEnabled } from '$lib/stores/context-specific/resultScreenStore';
import { errorPopup } from './errorHandling';

// Load new location (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------
export async function generateNewLocation(type) {
    try {
        const newLocationArray = await getLocationCoordinates(type);
        currentLocationLatitude.set(Number(newLocationArray[0]));
        currentLocationLongitude.set(Number(newLocationArray[1]));

        // Set country
        if (get(countryGuessr)) setCountryGuesserCountry(newLocationArray[2]);

        // Set image
        if (get(imageGuessr)) loadImageFromUrl(newLocationArray[2]);

    } catch (error) {
        console.error("The coordinates for the panorama are not defined. " + "Lat: " + get(currentLocationLatitude) + " Long: " + get(currentLocationLongitude));
        errorPopup("Error loading locations", "Failed to retrieve locations from the server.", error.message);
    }

    if (!get(resultScreenEnabled)) resetMap(); // Reset minimap & re-adjust to potentially new map (only if result screen isn't enabled, since that'd clear it)
}