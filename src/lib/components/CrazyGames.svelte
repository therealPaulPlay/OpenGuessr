<!-- This component handles the SDK stuff, and checks if the crazy-games query is being used -->
<script>
	import { onMount } from "svelte";
	import { roundAmount, roundLength, hostStage, roomcode, socket } from "$lib/stores/context-specific/multiplayerStore";
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import {
		adsDisabled,
		crazyGames,
		preventFullscreen,
		disableAutoAuthentication,
	} from "$lib/stores/context-specific/platformSettingsStore";
	import { joinFromAnywhere, setupMultiplayerRoom } from "$lib/logic/multiplayerLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { helpPopup } from "$lib/stores/uiStore";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

	onMount(async () => {
		try {
			let urlParams = new URLSearchParams(window.location.search);
			let crazyGamesEnabled = urlParams.get("crazy-games");

			if (crazyGamesEnabled) {
				// Platform settings
				adsDisabled.set(true);
				preventFullscreen.set(true);
				disableAutoAuthentication.set(true);
				crazyGames.set(true); // Enable platform

				// Show Help Popup
				if (!localStorage.getItem("helpPopupCompleted")) {
					helpPopup.set(true);
					localStorage.setItem("helpPopupCompleted", "true");
				}

				// Load and initialize SDK
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
					script.onload = () => {
						resolve();
					};
					script.onerror = reject;
					document.head.appendChild(script);
				});

				await window.CrazyGames.SDK.init();
				window.CrazyGames.SDK.game.loadingStart();

				setTimeout(() => {
					window.CrazyGames.SDK.game.loadingStop();
					window.CrazyGames.SDK.game.gameplayStart();
					const roomCode = window.CrazyGames.SDK.game.getInviteParam("join");
					if (roomCode) joinFromAnywhere(roomCode);

					if (window.CrazyGames.SDK.game.isInstantJoin) {
						goto("/multiplayer/host");
						setupMultiplayerRoom(get(roundAmount), get(roundLength));
						hostStage.set(2); // Go to second stage
					}
				}, 150);

				// Automatic signup / login (if user is not authenticated)
				authenticateWithCrazyGames();
				window.CrazyGames.SDK.user.addAuthListener(authenticateWithCrazyGames); // Attach auth listener for if the user signs up mid play

				resultScreenEnabled.subscribe((value) => {
					if (value) window.CrazyGames.SDK.game.gameplayStop();
					else window.CrazyGames.SDK.game.gameplayStart();
				});

				roomcode.subscribe((value) => {
					if (value && !get(socket)?.getStorage?.divisionRoom) {
						window.CrazyGames.SDK.game.showInviteButton({
							join: value,
						});
					} else window.CrazyGames.SDK.game.hideInviteButton();
				});
			}
		} catch (error) {
			console.error("Error loading and starting CrazyGames SDK:", error);
		}
	});

	// This will attempt registration and/or login only using a crazy games id.
	async function authenticateWithCrazyGames() {
		if ($isAuthenticated) return; // Exit if user is already authenticated (e.g. with bearer token from openguessr.com)
		let token;

		try {
			token = await window.CrazyGames.SDK.user.getUserToken();
		} catch (e) {
			return console.error("Error obtaining CrazyGames Token (likely, user is not logged in):", e);
		}

		try {
			const response = await fetch($apiUrl + "/accounts/cg-authenticate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json", // Set content type to JSON
				},
				body: JSON.stringify({
					crazyGamesToken: token, // Send the token in the body
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Authentication failed");
			}

			const data = await response.json();

			// Store login information
			localStorage.setItem("id", data.id);
			localStorage.setItem("bearer", data.token);

			// Now, set UI status and fetch user info
			checkAuthenticationStatus();
		} catch (error) {
			console.error("Error authenticating with CrazyGames:", error);
		}
	}
</script>
