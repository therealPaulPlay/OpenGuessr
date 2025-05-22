import { readable } from "svelte/store";

export const accountUrl = readable("http://localhost:3005"); // TODO RESET
export const locationUrl = readable("https://locations.openguessr.com");