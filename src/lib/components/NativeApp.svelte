<script>
	import { onMount } from "svelte";
	import { nativePlatform } from "$lib/stores/context-specific/platformSettingsStore";
	import { setMuted } from "$lib/utils/soundManager";

	onMount(() => {
		// Iframes don't get the electron and capacitor globals, so pass them
		try {
			window.Capacitor = window.parent.Capacitor ?? window.Capacitor; // Plugin calls on Android only work on the parent, so prefer that when available
			window.electronApp ??= window.parent.electronApp; // If electronApp is undefined or null, assign right
		} catch {}

		try {
			if (window.Capacitor?.isNativePlatform()) {
				nativePlatform.set(window.Capacitor.getPlatform());
				window.Capacitor.Plugins.SplashScreen?.hide(); // Hide the splash screen since the site is now loaded
				document.addEventListener("visibilitychange", () => setMuted(document.hidden)); // Android keeps playing audio in the background
			} else if (window.electronApp) nativePlatform.set(window.electronApp.platform);
		} catch (error) {
			console.error("Error initializing native app:", error);
		}
	});
</script>
