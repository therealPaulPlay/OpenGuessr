import { countryGuessr } from "$lib/stores/modeStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { selectedCountryGuesserCountryCode } from "$lib/stores/context-specific/countryGuessrStore";
import { getCountryName } from "$lib/utils/getCountryName";

const motivationalMessages = {
    5: ["Rainbolt?", "How?", "Do you have an A in geography?", "Wow.", "Time for a screenshot.", "Seriously impressive.", "Astounding."],
    100: ["Incredible guess.", "It doesn't get much better than that.", "Great accuracy.", "The gut feeling was right!", "It was that other street.", "A short drive away!", "Yeah, we'll take that."],
    1000: ["Nice, that's near the location!", "You're good at this.", "Quite close!", "Almost there!", "Yup, that was impressive.", "That's how it's done."],
    5000: ["There's some room for improvement.", "Not bad, but not great either.", "Right area, wrong spot.", "From far away it looks close.", "It's a guess, not a 'know'.", "It's something."],
    default: ["Distance is relative. Here, relatively big.", "You'll get it next time!", "At least it was on the correct planet.", "It could have been worse.", "Just a quick teleportation away."],
};

export function motivationalResultMessage(distance) {
    let smallestKey = "default";
    let smallestDistance = Infinity;

    Object.entries(motivationalMessages).forEach(([key, value]) => {
        if (key !== "default") {
            // If smaller or equal to the distance, and smaller than the current smallest, update current smallest
            const keyDistance = Number(key);
            if (distance <= keyDistance && keyDistance < smallestDistance) {
                smallestDistance = keyDistance;
                smallestKey = key;
            }
        }
    });

    const applicableMessages = motivationalMessages[smallestKey];
    let message = applicableMessages[Math.floor(Math.random() * applicableMessages.length)];

    // In Country guessr, tell the country
    if (get(countryGuessr)) message = "The country is " + (getCountryName(get(selectedCountryGuesserCountryCode)) || "Unknown") + ".";
    return message;
}

// Haversine formula, takes spherical nature of planet into account
export function calculateDistances(mapsLat = 0, mapsLon = 0) {
    const R = 6371; // Radius of the Earth in km
    const lat1 = get(currentLocationLatitude) * Math.PI / 180; // Convert degrees to radians
    const lon1 = get(currentLocationLongitude) * Math.PI / 180;
    const lat2 = mapsLat * Math.PI / 180;
    const lon2 = mapsLon * Math.PI / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
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