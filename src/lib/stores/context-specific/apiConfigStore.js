import { readable } from "svelte/store";

export const apiUrl = readable("http://localhost:3005");
export const websocketUrl = readable("ws://localhost:3005/socket");

// Misc
export const discordInviteUrl = readable("https://discord.gg/CSc3MbDrZ8");