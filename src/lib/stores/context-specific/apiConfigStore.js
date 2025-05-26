import { readable } from "svelte/store";

export const accountUrl = readable("http://localhost:3005");
export const locationUrl = readable("https://locations.openguessr.com");