<script>
	import { onMount } from "svelte";
	import { bugspotPopup } from "$lib/stores/uiStore";
	import IframePopup from "./ui/IframePopup.svelte";

	let consoleLogs = [];
	let frozenUrl; // Store frozen URL when popup opens
	
	const bugspotFormUrl = "https://bugspot.dev/form/7c145412-d318-4683-b504-681d630a08ee";

	onMount(() => {
		try {
			const originals = [console.log, console.error, console.warn];
			["log", "error", "warn"].forEach((method, i) => {
				console[method] = function (...args) {
					originals[i].apply(console, args);
					if (window === window.top) {
						// Skip iframe logs
						const msg = args
							.map((a) => {
								if (a instanceof Error) return a.message;
								if (typeof a === "object" && a !== null) return `[${a.constructor?.name || "Object"}]`;
								return String(a);
							})
							.join(" ");
						consoleLogs.push(`${method.charAt(0).toUpperCase() + method.slice(1)}: ${msg}`);
						if (consoleLogs.length > 50) consoleLogs = consoleLogs.slice(-50);
					}
				};
			});
			return () => originals.forEach((orig, i) => (console[["log", "error", "warn"][i]] = orig));
		} catch (error) {
			console.error("Failed to set up console listeners:", error);
		}
	});

	let url = $derived.by(() => {
		if ($bugspotPopup && !frozenUrl) {
			const userId = localStorage.getItem("id"); // Only fetch when popup opens
			const userIdText = userId ? `User ID: ${parseInt(userId)}\n` : "";
			const customData = `${userIdText}Console logs:\n${consoleLogs.join("\n")}`;
			frozenUrl = `${bugspotFormUrl}?custom-data=${encodeURIComponent(customData)}`;
		}
		if (!$bugspotPopup) frozenUrl = null // Reset when closed
		return frozenUrl || bugspotFormUrl;
	});
</script>

<IframePopup src={url} bind:open={$bugspotPopup} wide={true} />
