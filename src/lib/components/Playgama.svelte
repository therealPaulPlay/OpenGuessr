<script module>
	import { get } from "svelte/store";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { checkAuthentication } from "$lib/logic/accountLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showErrorPopup } from "openguessr-ui";

	// Skip partner platforms that don't support playgama auth verification (those who don't iFrame the Playgama page)
	export function playgamaLoginSupported() {
		return ["playgama", "qa_tool"].includes(window.bridge?.platform?.id);
	}

	export async function authenticateWithPlaygama() {
		if (get(isAuthenticated)) return; // Exit if user is already authenticated (e.g. with bearer token from OpenGuessr)
		if (!window.bridge?.player?.isAuthorized) return; // User isn't authenticated
		if (!playgamaLoginSupported()) return;

		try {
			const response = await fetch(get(apiUrl) + "/accounts/pg-authenticate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playgamaData: window.bridge.player.extra,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || `Authentication failed with status ${response.status}`);
			}

			const data = await response.json();

			// Store login information
			localStorage.setItem("id", data.id);
			localStorage.setItem("bearer", data.token);

			// Now, set UI status and fetch user info
			checkAuthentication();
		} catch (error) {
			console.error("Error occurred authenticating with Playgama:", error);
			showErrorPopup("Error authenticating", "An error occurred trying to authenticate with Playgama.", error.message);
		}
	}

	let rewardedPromise;

	export async function playgamaRewardedTokenAd() {
		if (rewardedPromise) return { granted: false, error: "Already showing ad." };
		if (!window.bridge?.advertisement?.isRewardedSupported) return { granted: true, error: null }; // Give reward without ad since ad isn't supported
		try {
			await new Promise((resolve, reject) => {
				rewardedPromise = { resolve, reject };
				window.bridge.advertisement.showRewarded("free_tokens"); // Show the default ad (free_tokens)
			});
		} catch (error) {
			console.error("Error showing Playgama rewarded ad:", error);
			return { granted: false, error: error.message };
		} finally {
			rewardedPromise = null;
		}

		if (window.bridge?.advertisement?.rewardedPlacement === "free_tokens") return { granted: true, error: null };
		else return { granted: false, error: null };
	}
</script>

<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { playgama } from "$lib/stores/context-specific/platformSettingsStore";
	import { setMuted } from "$lib/utils/soundManager";

	onMount(async () => {
		try {
			let urlParams = page.url.searchParams;
			let playgamaEnabled = urlParams.get("playgama");

			if (playgamaEnabled) {
				playgama.set(true); // Enable platform

				// Load and initialize the Bridge SDK
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = "https://bridge.playgama.com/v2/stable/playgama-bridge.js";
					script.onload = () => {
						resolve();
					};
					script.onerror = reject;
					document.head.appendChild(script);
				});
				await window.bridge.initialize({ configFilePath: "/playgama-bridge-config.json" });

				// Emit game ready
				await window.bridge.platform
					.sendMessage("game_ready")
					.catch((error) => console.error("Error emitting Playgama game_ready:", error));

				// Playgama treats window blur (happens too on iFrame focus) as hidden,
				// so we gate behind document.hasFocus which is true even when the iFrame is focused
				function updateMute() {
					const { _audioStateAggregator: audio, _pauseStateAggregator: pause } = window.bridge.platform._platformBridge ?? {};
					const platformMuted = ["interstitial", "rewarded", "platform", "rate"].some((source) => audio?.getState(source) || pause?.getState(source));
					setMuted(!document.hasFocus() || platformMuted);
				}

				// Mute when the platform pauses the game (Playgama requirement)
				window.bridge.platform.on(window.bridge.EVENT_NAME.PAUSE_STATE_CHANGED, updateMute);
				window.bridge.platform.on(window.bridge.EVENT_NAME.AUDIO_STATE_CHANGED, updateMute);

				// Refocusing by clicking into the iframe doesn't fire any event, hence we check focus on an interval instead (this also replaces document visibilitychange checks)
				setInterval(updateMute, 500);

				// Check immediately in case e.g. the game is backgrounded during loading
				updateMute();

				// Automatic signup / login (if user is not authenticated)
				authenticateWithPlaygama();

				// Register rewarded ad listener
				window.bridge.advertisement.on(window.bridge.EVENT_NAME.REWARDED_STATE_CHANGED, (state) => {
					switch (state) {
						case "closed":
							rewardedPromise?.reject(new Error("Dismissed."));
							break;
						case "rewarded":
							rewardedPromise?.resolve();
							break;
						case "failed":
							rewardedPromise?.reject(new Error("An error occurred."));
							break;
					}
				});
			}
		} catch (error) {
			console.error("Error loading and starting Playgama Bridge SDK:", error);
		}
	});
</script>
