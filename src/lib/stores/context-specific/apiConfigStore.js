import { readable } from "svelte/store";

export const apiUrl = readable("https://accounts.openguessr.com");
export const websocketUrl = readable("wss://accounts.openguessr.com/socket");

// Misc
export const discordInviteUrl = readable("https://discord.gg/CSc3MbDrZ8");
export const discordBotUrl = readable("https://discord.com/oauth2/authorize?client_id=1540490382255726722");
export const googleOauthClientId = readable("173042266770-kumghsvt3aaparhacqv9b3g9hr2uvt4h.apps.googleusercontent.com")