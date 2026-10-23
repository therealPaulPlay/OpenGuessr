<script>
	import { onMount } from "svelte";
	import { nativePlatform } from "$lib/stores/context-specific/platformSettingsStore";

	onMount(() => {
		// Iframes don't get the electron and capacitor globals, so pass them
		try {
			window.Capacitor ??= window.parent.Capacitor;
			window.electronApp ??= window.parent.electronApp;
		} catch {}

		try {
			if (window.Capacitor?.isNativePlatform()) {
				nativePlatform.set(window.Capacitor.getPlatform());
				window.Capacitor.Plugins.SplashScreen?.hide(); // Hide the splash screen since the site is now loaded
			} else if (window.electronApp) nativePlatform.set(window.electronApp.platform);
		} catch (error) {
			console.error("Error initializing native app:", error);
		}
	});
</script>
