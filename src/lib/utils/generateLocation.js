// This generates a new location, but keep in mind that this is NOT the function to present the user with a new location! This does not check the selected map etc.
import { getLocationCoordinates } from '$lib/logic/locationGeneration';
import { socket } from "$lib/stores/context-specific/multiplayerStore"
import { countryGuessr, multiplayer, imageGuessr } from "$lib/stores/modeStore";
import { currentLocationLatitude, currentLocationLongitude } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuessrFunctions';
import { loadPanorama } from '$lib/utils/loadPanorama';
import { loadImageFromUrl } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';
import { resetMap } from '$lib/logic/miniMap';
import { resultScreenEnabled } from '$lib/stores/context-specific/resultScreenStore';

// Load new location (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------
export async function generateNewLocation(type) {
    let newLocationArray;

    try {
        newLocationArray = await getLocationCoordinates(type);
    } catch (error) {
        console.error("Invalid location generation type in generateNewLocation function. Error:", error);
    }

    try {
        currentLocationLatitude.set(Number(newLocationArray[0]));
        currentLocationLongitude.set(Number(newLocationArray[1]));

        // Set country guesser country
        if (get(countryGuessr)) setCountryGuesserCountry(newLocationArray[2]);

        // Set image guesser image
        if (get(imageGuessr)) loadImageFromUrl(newLocationArray[2]);

    } catch {
        console.error("The coordinates to load the iframe from are not defined. " + "Lat: " + get(currentLocationLatitude) + " Long: " + get(currentLocationLongitude));
    }

    loadPanorama(get(currentLocationLatitude), get(currentLocationLongitude));
    if (!get(resultScreenEnabled)) resetMap(); // Reset minimap for when the category was changed mid-game
}