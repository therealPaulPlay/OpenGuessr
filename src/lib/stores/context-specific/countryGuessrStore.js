import { writable } from "svelte/store";

export const selectedCountryField = writable(0);
export const selectedCountryGuesserCountry = writable(0); // The correct country, that the generator selected