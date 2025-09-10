import { readable } from "svelte/store";

export const accountUrl = readable("https://accounts.openguessr.com");
export const websocketUrl = readable("wss://accounts.openguessr.com/socket");