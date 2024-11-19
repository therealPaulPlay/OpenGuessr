// Generate a new location (new Panorama, New Image etc.)
import { getLocationCoordinates } from '$lib/logic/locationGeneration';
// import { startMultiplayerRound, isHost } from './multiplayer.js'; !TODO !CHANGE
import { countryGuesser, multiplayer, imageGuesser } from "$lib/stores/modeStore";
import { currentLocationLatitude, currentLocationLongitude } from '$lib/stores/locationStore';
import { setCountryGuesserCountry } from '$lib/utils/countryGuesserFunctions';
import { loadPanorama } from '$lib/stores/locationStore';
import { loadImageFromUrl } from '$lib/utils/imageGuesserFunctions';
import { get } from 'svelte/store';

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

        if (get(countryGuesser) && !get(multiplayer)) {
            setCountryGuesserCountry(newLocationArray[2]);
        }

        if (get(imageGuesser) && !get(multiplayer)) {
            loadImageFromUrl(newLocationArray[2]);
        }

    } catch {
        console.error("The coordinates to load the iframe from are not defined. " + "Lat: " + get(currentLocationLatitude) + " Long: " + get(currentLocationLongitude));
    }

    loadPanorama(get(currentLocationLatitude), get(currentLocationLongitude));

    if (get(multiplayer) && isHost) {
        startMultiplayerRound(get(currentLocationLatitude), get(currentLocationLongitude));
    }

}