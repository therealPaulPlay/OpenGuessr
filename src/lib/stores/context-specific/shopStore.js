import { writable } from "svelte/store"

export const specialOfferPins = writable();
export const specialOfferPrice = writable();
export const specialOfferRarity = writable();
export const specialOfferLoadingText = writable("Loading...");