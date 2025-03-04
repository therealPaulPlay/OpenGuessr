import { readable } from "svelte/store";

export const accountUrl = readable("https://accounts.openguessr.com");
export const locationUrl = readable("https://locations.openguessr.com");
export const friendUrl = readable("https://friends.openguessr.com");