<script>
	import { onMount } from "svelte";
	import { bugspotPopup } from "$lib/stores/uiStore";
	import IframePopup from "./ui/IframePopup.svelte";

	let consoleLogs = $state([]);

	onMount(() => {
		try {
			const originals = [console.log, console.error, console.warn];

			["log", "error", "warn"].forEach((method, i) => {
				console[method] = function (...args) {
					originals[i].apply(console, args);
					// Skip iframe logs
					if (window === window.top) {
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

	let customData = $derived.by(() => {
		if (!$bugspotPopup) return undefined;

		const userId = localStorage.getItem("id");
		const userIdText = userId ? `User ID: ${parseInt(userId)}\n` : "";

		return `${userIdText}Console logs:\n${consoleLogs.join("\n")}`;
	});
	let url = $derived(
		`https://bugspot.dev/form/7c145412-d318-4683-b504-681d630a08ee${customData ? `?custom-data=${encodeURIComponent(customData)}` : ""}`,
	);
</script>

<IframePopup src={url} bind:open={$bugspotPopup} wide={true} />
