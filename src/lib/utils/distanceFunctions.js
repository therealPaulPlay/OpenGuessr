import { checkIfGuessWasCorrect } from "$lib/utils/countryGuessrFunctions";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";
import { selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuessrStore";

let veryCloseDistances;
let closeDistances;
let farDistances;
let extraMsg;

// Haversine formula, takes spherical nature of planet into account
export function calculateDistances(mapsLat = 0, mapsLong = 0) {
    const R = 6371; // Radius of the Earth in km
    const lat1 = get(currentLocationLatitude) * Math.PI / 180; // Convert degrees to radians
    const lon1 = get(currentLocationLongitude) * Math.PI / 180;
    const lat2 = mapsLat * Math.PI / 180;
    const lon2 = mapsLong * Math.PI / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
}

export function motivationalResultMessage(distance) {
    let resultAsString;

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Do you have an A in geography?", "Wow.", "Time for a screenshot.", "Seriously impressive."];
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!", "Yup, that was impressive.", "That's how it's done!"];
    farDistances = ["Distance is relative. Here, relatively big.", "You'll get it next time!", "At least it was on the correct planet.", "It could have been worse."];

    // Motivational quotes
    if (distance < 5) extraMsg = veryCloseDistances[Math.floor(Math.random() * veryCloseDistances.length)];
    else if (distance < 1000) extraMsg = closeDistances[Math.floor(Math.random() * closeDistances.length)];
    else extraMsg = farDistances[Math.floor(Math.random() * farDistances.length)];

    // In Country guessr, tell the country
    if (get(countryGuessr)) extraMsg = "The country is " + get(selectedCountryGuesserCountry) + ".";
    return extraMsg;
}

// This function neatly formats a distance in meters into a readable string (e.g. 500 km or 15 miles)
export function formatDistance(distance) {
    let finalResult;
    let resultString;

    const distanceUnit = localStorage.getItem("distanceUnit") || "kilometers";
    distance = Number(distance); // For error prevention

    if (distance < 5) {
        finalResult = Math.round(distance * 1000);
        if (distanceUnit == "miles") finalResult = Math.round(finalResult * 1.09361);
        finalResult = finalResult.toLocaleString();

        if (distanceUnit == "miles") resultString = finalResult + " yards";
        else resultString = finalResult + " m";

    } else {
        finalResult = Math.round(distance * 10) / 10;
        if (distanceUnit == "miles") finalResult = Math.round(finalResult * 0.621371 * 10) / 10;

        finalResult = finalResult.toLocaleString();

        if (distanceUnit == "miles") resultString = finalResult + " miles";
        else resultString = finalResult + " km";
    }

    return resultString;
}