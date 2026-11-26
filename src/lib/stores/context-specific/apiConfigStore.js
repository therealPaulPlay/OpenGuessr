import { readable } from "svelte/store";

// Backend
export const apiUrl = readable("https://accounts.openguessr.com");
export const websocketUrl = readable("wss://accounts.openguessr.com/socket");

// OAuth
export const googleOauthClientId = readable("173042266770-kumghsvt3aaparhacqv9b3g9hr2uvt4h.apps.googleusercontent.com");
export const appleOauthServicesId = readable("com.paulplay.openguessr.signin");

// Misc
export const educationUrl = readable("https://education.openguessr.com");
export const discordInviteUrl = readable("https://discord.gg/CSc3MbDrZ8");
export const gitHubUrl = readable("https://github.com/therealPaulPlay/OpenGuessr");
export const redditUrl = readable("https://www.reddit.com/r/OpenGuessr/");
export const youTubeUrl = readable("https://www.youtube.com/@OpenGuessrOfficial");
export const playStoreUrl = readable("https://play.google.com/store/apps/details?id=com.paulplay.openguessr");
export const appStoreUrl = readable("https://apps.apple.com/app/id6826926149");
export const discordBotUrl = readable("https://discord.com/oauth2/authorize?client_id=1540490382255726722");