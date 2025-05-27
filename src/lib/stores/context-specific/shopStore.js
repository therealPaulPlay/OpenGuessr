import { writable } from "svelte/store"

export const specialOfferPins = writable();
export const specialOfferPrice = writable();
export const specialOfferRarity = writable();
export const specialOfferLoadingText = writable("Loading...");

// Purchase animation
export const shopPurchaseAnimation = writable(false);
export const shopAnimationImages = writable([]);