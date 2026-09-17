<script>
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { analyticsDisabled } from "$lib/stores/context-specific/platformSettingsStore";

	onMount(initAnalytics);

	function initAnalytics() {
		try {
			if (get(analyticsDisabled)) return; // Exit if analytics should be disabled

			window["gtag_enable_tcf_support"] = true; // Listen to any TCF-enabled CMP
			window.dataLayer = window.dataLayer || [];

			// Must use legacy arguments, doesn't work with spreading ...args
			function gtag() {
				window.dataLayer.push(arguments);
			}

			gtag("js", new Date());

			gtag("config", "G-DXD64B7ZDX", {
				cookie_domain: location.hostname,
				cookie_flags: "SameSite=None; Secure",
			});

			// Load script dynamically
			const script = document.createElement("script");
			script.src = "https://www.googletagmanager.com/gtag/js?id=G-DXD64B7ZDX";
			script.async = true;
			document.head.appendChild(script);
		} catch (error) {
			console.error("Error loading GA4 in analytics.js: " + error);
		}
	}
</script>
