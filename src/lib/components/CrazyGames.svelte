<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { roomCode, roomLocked, socket } from "$lib/stores/context-specific/multiplayerStore";
	import { checkAuthentication } from "$lib/logic/accountLogic";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { joinFromAnywhere, createMultiplayerRoom, leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { leaveCompetition } from "$lib/logic/competitionLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { showErrorPopup } from "openguessr-ui";
	import { inMenu } from "$lib/stores/uiStore";

	onMount(async () => {
		try {
			let urlParams = page.url.searchParams;
			let crazyGamesEnabled = urlParams.get("crazy-games");

			if (crazyGamesEnabled) {
				crazyGames.set(true); // Enable platform

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

				// Mark loading as completed, check for link join and instant multiplayer start
				setTimeout(() => {
					try {
						window.CrazyGames.SDK.game.loadingStop();

						const code = window.CrazyGames.SDK.game.getInviteParam("join");
						if (code) joinFromAnywhere(code);

						if (window.CrazyGames.SDK.game.isInstantMultiplayer) {
							goto("/multiplayer/host");
							createMultiplayerRoom();
						}
					} catch (error) {
						console.error("Error in CrazyGames after-load timeout:", error);
					}
				}, 150);

				// Emit gameplay start and stop events
				let gameplayStarted = false;
				inMenu.subscribe((value) => {
					try {
						if (!value) {
							window.CrazyGames.SDK.game.gameplayStart();
							gameplayStarted = true;
						} else if (gameplayStarted) window.CrazyGames.SDK.game.gameplayStop();
					} catch (error) {
						console.error("Failed to emit CrazyGames gameplay events:", error);
					}
				});

				// Join friends from everywhere
				window.CrazyGames.SDK.game.addJoinRoomListener((inviteParams) => {
					const code = inviteParams?.join;
					if (!code || code === get(roomCode)) return;
					leaveMultiplayer();
					leaveCompetition(false);
					joinFromAnywhere(code);
				});

				// Share multiplayer status with CrazyGames
				const updateCrazyGamesRoom = () => {
					try {
						const code = get(roomCode);
						if (!code) return window.CrazyGames.SDK.game.leftRoom();

						const isJoinable =
							!get(roomLocked) && !get(socket)?.storage?.matchmakingRoom && !get(socket)?.storage?.tournamentRoom;
						window.CrazyGames.SDK.game.updateRoom({
							roomId: code,
							isJoinable,
							...(isJoinable && { inviteParams: { join: code } }),
						});
					} catch (error) {
						console.error("Failed to update CrazyGames room data:", error);
					}
				};
				roomCode.subscribe(updateCrazyGamesRoom);
				roomLocked.subscribe(updateCrazyGamesRoom);

				// Automatic signup / login (if user is not authenticated)
				authenticateWithCrazyGames();
				window.CrazyGames.SDK.user.addAuthListener(authenticateWithCrazyGames); // Attach auth listener for if the user signs up mid play
			}
		} catch (error) {
			console.error("Error loading and starting CrazyGames SDK:", error);
		}
	});

	// This will attempt registration and/or login only using a crazy games id.
	async function authenticateWithCrazyGames() {
		if ($isAuthenticated) return; // Exit if user is already authenticated (e.g. with bearer token from OpenGuessr)
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
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					crazyGamesToken: token,
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
			console.error("Error authenticating with CrazyGames:", error);
			showErrorPopup("Error authenticating", "An error occurred trying to authenticate with CrazyGames.", error.message);
		}
	}
</script>
