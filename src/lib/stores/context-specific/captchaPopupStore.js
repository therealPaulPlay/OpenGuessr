import { writable } from "svelte/store";

export const captchaPopupVisible = writable(false);
export const captchaToken = writable();