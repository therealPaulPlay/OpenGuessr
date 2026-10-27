<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { get } from "svelte/store";
	import { analyticsDisabled, native } from "$lib/stores/context-specific/platformSettingsStore";

	const GOOGLE_TAG_CODE = "G-DXD64B7ZDX";

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

			// Native uses GA4 cookieless
			if (get(native)) {
				gtag("consent", "default", { ad_storage: "denied", ad_personalization: "denied", ad_user_data: "denied" });
				gtag("config", GOOGLE_TAG_CODE, { client_storage: "none" });
			} else {
				gtag("config", GOOGLE_TAG_CODE, {
					cookie_domain: page.url.hostname,
					cookie_flags: "SameSite=None; Secure",
				});
			}

			// Load script dynamically
			const script = document.createElement("script");
			script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_CODE}`;
			script.async = true;
			document.head.appendChild(script);
		} catch (error) {
			console.error("Error loading GA4 in analytics.js: " + error);
		}
	}
</script>
