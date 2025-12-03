import { readable } from "svelte/store";

export const apiUrl = readable("https://accounts.openguessr.com");
export const websocketUrl = readable("wss://accounts.openguessr.com/socket");

// Misc
export const discordInviteUrl = readable("https://discord.gg/CSc3MbDrZ8");