import { resultScreenEnabled } from './mainUI.js';
import { getLocationCoordinates } from '$lib/logic/locationGeneration.js';
import { applySingleplayerSettings } from './singleplayerOptions.js';
import { multiplayer, startMultiplayerRound, isHost } from './multiplayer.js';
import { checkIfGuessWasCorrect, countryGuesserMode, setCountryGuesserCountry } from './countryGuesser.js';
import { checkStartCompetitionRound } from './competitionLogic.js';
import { imageGuesserEnabled, loadImageFromUrl } from './imageGuesser.js';

// default coords of the location
export let currentStreetviewLat = 0;
export let currentStreetviewLong = 0;

// Load new location (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------

export async function generateNewLocation(type) {
    let newLocationArray;

    try {
        newLocationArray = await getLocationCoordinates(type);
    } catch (error) {
        console.error("Invalid location generation type in main.js / generateNewLocation. Error: " + error);
    }

    try {
        currentStreetviewLat = Number(newLocationArray[0]);
        currentStreetviewLong = Number(newLocationArray[1]);

        if (countryGuesserMode && !multiplayer) {
            setCountryGuesserCountry(newLocationArray[2]);
        }

        if (imageGuesserEnabled && !multiplayer) {
            loadImageFromUrl(newLocationArray[2]);
        }

    } catch {
        console.error("The coordinates to load the iframe from are not defined. " + "Lat: " + currentStreetviewLat + " Long: " + currentStreetviewLong);
    }

    loadIframe(currentStreetviewLat, currentStreetviewLong);

    if (multiplayer && isHost) {
        startMultiplayerRound(currentStreetviewLat, currentStreetviewLong);
    }

}