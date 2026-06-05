import { writable } from "svelte/store";

export const selectedCountryFieldIndex = writable(0);
export const selectedCountryGuesserCountryCode = writable(0); // The correct country, that the generator selected
export const countryGuessrCountriesArray = writable([]);