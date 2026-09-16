<script>
	import { onMount } from "svelte";
	import { y8Games } from "$lib/stores/context-specific/platformSettingsStore";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { checkAuthentication } from "$lib/logic/accountLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { errorPopup } from "$lib/utils/errorHandling";

	onMount(async () => {
		try {
			let urlParams = new URLSearchParams(window.location.search);
			let y8GamesEnabled = urlParams.get("y8-games");

			if (y8GamesEnabled) {
				y8Games.set(true); // Enable platform

				// Load and initialize the SDK
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = "https://cdn.y8.com/minimal-sdk/2-0/y8.min.js";
					script.onload = () => {
						resolve();
					};
					script.onerror = reject;
					document.head.appendChild(script);
				});

				// Wait for the SDK to be ready
				window.addEventListener(
					"y8sdk.ready",
					function () {
						window.Y8SDK = window.y8.sdk(); // Using window.Y8SDK for the SDK isn't a Y8 suggestion, it's purely done to mirror the CrazyGames implementation

						const appConfig = {
							appId: "6aa7ec357ddd233a7eae2e05",
							autoLogin: true,
						};

						window.Y8SDK.init(appConfig).catch((error) => console.error("Error initializing Y8 Games SDK:", error));

						window.Y8SDK.onAuth((user, error) => {
							if (error) {
								console.error("Y8 SDK auth error:", error);
								return;
							}
							if (!user) return; // If not signed in / no user, exit
							else authenticateWithY8Games(); // If there's a user, authenticate
						});
					},
					{ once: true },
				);
				if (window.y8 && window.y8.emitReadyEvent) window.y8.emitReadyEvent(); // Handle the case where the SDK already loaded
			}
		} catch (error) {
			console.error("Error loading and starting Y8 Games SDK:", error);
		}
	});

	async function authenticateWithY8Games(canRetry = true) {
		if ($isAuthenticated) return; // Exit if user is already authenticated (e.g. with bearer token from OpenGuessr)
		let accessToken;
		try {
			// Obtain the access token
			accessToken = window.Y8SDK.getAccessToken();
			if (!accessToken) throw new Error("Failed to obtain access token.");
		} catch (error) {
			return console.error("Error obtaining Y8Games token (likely, the user isn't actually signed in):", error);
		}

		try {
			const response = await fetch($apiUrl + "/accounts/y8-authenticate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					y8GamesToken: accessToken,
				}),
			});

			// The access token expired, refresh it and retry (recommended by Y8)
			if (response.status === 401 && canRetry) {
				try {
					await window.Y8SDK.refreshToken();
				} catch (error) {
					// The refresh token expired too, so the user simply isn't signed in
					return console.error("Error refreshing the Y8Games token:", error);
				}
				return authenticateWithY8Games(false); // Pass false - we only retry once
			}

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
			console.error("Error occured authenticating with Y8:", error);
			errorPopup("Error authenticating", "An error occured trying to authenticate with Y8.", error.message);
		}
	}
</script>
