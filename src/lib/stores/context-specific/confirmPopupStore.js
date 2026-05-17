import { writable } from "svelte/store";

export const confirmPopupVisible = writable(false);
export const confirmDescription = writable("Default");

export const confirmExecuteFunction = writable();

export const confirmUsernameInput = writable(false);
export const confirmPasswordInput = writable(false);

export const confirmConfirmText = writable("Default");
export const confirmTitle = writable("Default");

export const confirmPasswordValue = writable();
export const confirmUsernameValue = writable();