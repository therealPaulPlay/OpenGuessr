<script>
	import { onMount } from "svelte";
	import { nativePlatform } from "$lib/stores/context-specific/platformSettingsStore";
	import { setMuted } from "$lib/utils/soundManager";

	onMount(() => {
		// Iframes don't get the Desktop and Capacitor globals, so pass them
		try {
			window.Capacitor = window.parent.Capacitor ?? window.Capacitor; // Plugin calls on Android only work on the parent, so prefer that when available
			window.Desktop ??= window.parent.Desktop; // If Desktop is undefined or null, assign right
		} catch {}

		try {
			if (window.Capacitor?.isNativePlatform()) {
				nativePlatform.set(window.Capacitor.getPlatform());
				setTimeout(() => window.Capacitor.Plugins.SplashScreen?.hide(), 100); // Hide native splash screen once site loaded (delayed as WK WebView sometimes applies safe-areas late)
				document.addEventListener("visibilitychange", () => setMuted(document.hidden)); // Android keeps playing audio in the background
			} else if (window.Desktop) nativePlatform.set(window.Desktop.platform);
		} catch (error) {
			console.error("Error initializing native app:", error);
		}
	});
</script>
