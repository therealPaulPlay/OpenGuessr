<script>
	import { ArrowLeft, Eye, EyeClosed, Mail } from "@lucide/svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import inIframe from "$lib/utils/checkIframe";
	import { onMount } from "svelte";
	import { blur, fade, scale, slide } from "svelte/transition";
	import { apiUrl, googleOauthClientId, appleOauthServicesId } from "$lib/stores/context-specific/apiConfigStore";
	import { nativePlatform } from "$lib/stores/context-specific/platformSettingsStore";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { Notification, showNotification, InfoBanner } from "openguessr-ui";
	import { playSound } from "$lib/utils/soundManager";
	import { signOut } from "$lib/logic/accountLogic";

	let actionButtonBusy = $state(false);

	// If the signup page is embedded, these values will be sent to the top page
	function notifyIframeParent(id, token) {
		window.parent.postMessage(`id ${id}`, "*"); // OpenGuessr user ID
		window.parent.postMessage(`token ${token}`, "*"); // Bearer token
		window.parent.postMessage("close", "*");
	}

	// Provider-agnostic function for sending the OAuth tokens to the server
	async function authenticateWith(provider, body) {
		actionButtonBusy = true;

		try {
			const response = await fetch(`${$apiUrl}/accounts/${provider}-authenticate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error ?? response.status);
			if (!data.token || data.id == null) throw new Error("Token or ID missing from successful response"); // To avoid overriding potential local account data with nullish values

			localStorage.setItem("bearer", data.token);
			localStorage.setItem("id", data.id);

			if (inIframe()) notifyIframeParent(data.id, data.token);
			else goto("/");
		} catch (error) {
			console.error(`${provider} login failed:`, error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	// Google OAuth --------------------------------------------------------------------------------------------------------
	let googleCodeListener;

	async function startGoogleLogin() {
		try {
			// App path
			const GoogleSignIn = window.Capacitor?.Plugins?.GoogleSignIn;
			if (GoogleSignIn) {
				await GoogleSignIn.initialize({ clientId: $googleOauthClientId });
				const { idToken } = await GoogleSignIn.signIn();
				return authenticateWith("google", { idToken });
			}

			// Web path
			const redirectUri = page.url.origin + page.url.pathname;

			// Listen for a message with the code from the Google window/popup
			// This code is sent via the onMount() callback that triggers after the redirect from Google back to /signup
			if (!googleCodeListener) {
				googleCodeListener = (event) => {
					if (event.origin !== page.url.origin || event.data?.type !== "google-oauth-code") return;
					window.removeEventListener("message", googleCodeListener);
					googleCodeListener = undefined;
					authenticateWith("google", { code: event.data.code, redirectUri });
				};
				window.addEventListener("message", googleCodeListener);
			}

			// Open the Google popup (redirects back to OpenGuessr once completed)
			const params = new URLSearchParams({
				client_id: $googleOauthClientId,
				redirect_uri: redirectUri,
				response_type: "code",
				scope: "openid email profile",
				prompt: "select_account",
			});
			window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, "google-oauth", "width=500,height=600");
		} catch (error) {
			if (error.code == "SIGN_IN_CANCELED") return console.warn("Google signin canceled:", error.message);
			console.error("Google signin failed:", error);
			showNotification(error.message);
		}
	}

	// Apple OAuth ---------------------------------------------------------------------------------------------------------
	async function startAppleLogin() {
		const redirectUri = page.url.origin + page.url.pathname; // Must be registered for the Services ID, iOS signs in natively without one

		try {
			// App path
			const AppleSignIn = window.Capacitor?.Plugins?.AppleSignIn;
			if (AppleSignIn) {
				const ios = $nativePlatform == "ios";
				if (!ios) await AppleSignIn.initialize({ clientId: $appleOauthServicesId });

				const result = await AppleSignIn.signIn({
					scopes: ["EMAIL", "FULL_NAME"],
					...(!ios && { redirectUrl: redirectUri }),
				});
				return authenticateWith("apple", {
					authorizationCode: result.authorizationCode,
					redirectUri: ios ? undefined : redirectUri,
					name: [result.givenName, result.familyName].filter(Boolean).join(" "),
				});
			}

			// Web path
			// Apple's own SDK on the web, its popup works inside the signup iframe too
			if (!window.AppleID) throw new Error("Failed to load Apple signin.");

			window.AppleID.auth.init({
				clientId: $appleOauthServicesId,
				scope: "name email",
				redirectURI: redirectUri,
				usePopup: true,
			});
			const { authorization, user } = await window.AppleID.auth.signIn();
			authenticateWith("apple", {
				authorizationCode: authorization.code,
				redirectUri,
				name: [user?.name?.firstName, user?.name?.lastName].filter(Boolean).join(" "), // Only included on the first signin
			});
		} catch (error) {
			if (
				error.code == "SIGN_IN_CANCELED" ||
				["popup_closed_by_user", "user_cancelled_authorize"].includes(error.error)
			)
				return;
			console.error("Apple signin failed:", error);
			showNotification(error.message ?? error.error);
		}
	}

	// Load Apple SDK upfront to ensure it opens without delay, unless already loaded or in the app
	onMount(() => {
		if (window.Capacitor?.Plugins?.AppleSignIn || window.AppleID) return;
		const script = document.createElement("script");
		script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
		script.async = true;
		document.head.appendChild(script);
	});

	// Once Google signin is completed, it redirects back to OpenGuessr's signup
	// Since this is in a new window, we only want that additional window for Google's signin, so we close it, and post the code to the top /signup page that spawned the window
	onMount(() => {
		const params = page.url.searchParams;
		if (params.has("code"))
			window.opener?.postMessage({ type: "google-oauth-code", code: params.get("code") }, page.url.origin);
		if (params.has("code") || params.has("error")) window.close();
	});

	// API requests -------------------------------------------------------------------------------------------------------
	async function loginUser(email, password) {
		actionButtonBusy = true;

		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$apiUrl}/accounts/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email,
					password: password,
				}),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();

				// Important: Save the Token and ID, to enable future requests
				if (data["token"] && data["id"]) {
					localStorage.setItem("bearer", data["token"]);
					localStorage.setItem("id", data["id"]);
				}

				if (inIframe()) notifyIframeParent(data["id"], data["token"]);
				else goto("/");
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Login failed ", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	async function registerUser(username, email, password, captchaToken) {
		actionButtonBusy = true;

		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$apiUrl}/accounts/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"cf-turnstile-response": captchaToken,
				},
				body: JSON.stringify({ username, email, password }),
			});

			// Check if the response is successful
			if (response.ok) {
				await response.json();
				showNotification("Registration successful!");
				formType = "login";
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Registration failed:", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	// Send reset email
	async function sendPasswordResetEmail(email) {
		actionButtonBusy = true;

		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$apiUrl}/accounts/reset-password-request`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			// Check if the response is successful
			if (response.ok) {
				await response.json();
				showNotification("Password reset email sent!");
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Sending password reset request failed:", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	// Change password with reset token
	async function changePassword(token, newPassword) {
		actionButtonBusy = true;

		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$apiUrl}/accounts/reset-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, newPassword }),
			});

			// Check if the response is successful
			if (response.ok) {
				await response.json();
				showNotification("Password changed successfully!");
				formType = "login";
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Password change failed:", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	// Delete account with token from confirmation email
	async function deleteAccount(token) {
		actionButtonBusy = true;

		try {
			const response = await fetch(`${$apiUrl}/accounts/delete`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.userId == localStorage.getItem("id")) signOut(); // The deleted account is signed in here, sign it out
				showNotification("Your account has been deleted.");
				formType = "login";
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Account deletion failed:", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	// Toggle between login, signup, newPassword, reset and delete ---------------------------------------------------------------------------------------
	let formType = $state("login");

	// Password reset and account deletion links -------------------------------------------------------------------------------------------------------
	let resetToken;
	let deletionToken;

	onMount(() => {
		let urlParams = page.url.searchParams;
		resetToken = urlParams.get("reset-token");
		deletionToken = urlParams.get("deletion-token");
		const resetPresent = urlParams.get("reset");

		if (resetToken) {
			formType = "new-password";
			goto(page.url.pathname, { replaceState: true }); // Reset url to remove query
		} else if (deletionToken) {
			formType = "delete";
			goto(page.url.pathname, { replaceState: true });
		} else if (resetPresent) {
			formType = "reset";
			goto(page.url.pathname, { replaceState: true });
		}
	});

	function changePasswordIfValuesProvided(newPassword) {
		if (newPassword) changePassword(resetToken, newPassword);
		else showNotification("Please input a new password.");
	}

	// Signup UI Logic and Captcha ------------------------------------------------------------------------------------------------------------------------------
	function validateEmail(email) {
		var re = /\S+@\S+\.\S+/;
		return re.test(email);
	}

	// Check fields + validate email address structure
	function checkEmptyFields(isSignup) {
		if (isSignup) {
			if (username && password && validateEmail(email)) return true;
			else {
				showNotification("Please check your input.");
				return false;
			}
		} else {
			if (validateEmail(email) && password) return true;
			else {
				showNotification("Please check your input.");
				return false;
			}
		}
	}

	// Actions ---------------------------------------------------------
	function triggerAction() {
		switch (formType) {
			case "login":
				logInAction();
				break;
			case "signup":
				signUpAction();
				break;
			case "reset":
				sendPasswordResetEmail(email);
				break;
			case "new-password":
				changePasswordIfValuesProvided(password);
				break;
			case "delete":
				deleteAccount(deletionToken);
				break;
		}
	}

	// Signup and login ----------------------------------------------------------------------------------------------------------
	let email = $state();
	let password = $state();
	let username = $state();
	let captchaVisible = $state(false);

	// This is the function that runs when the user click on signup or presses enter.
	function signUpAction() {
		if (checkEmptyFields(true)) captchaVisible = true;
	}

	// This is the function that runs when the user click on login or presses enter.
	async function logInAction() {
		if (checkEmptyFields(false)) await loginUser(email, password);
	}

	$effect(() => {
		if (captchaVisible) renderCaptcha("#captcha-slot", window.onSignupTurnstileCompleted);
	});

	// Register turnstile callback
	onMount(() => {
		window.onSignupTurnstileCompleted = function (token) {
			captchaVisible = false;
			registerUser(username, email, password, token);
		};
	});

	// Toggle password field visability ----------------------------------------------------
	let passwordInputType = $state("password");

	function togglePasswordVisibility() {
		passwordInputType = passwordInputType == "password" ? "text" : "password";
	}
</script>

<svelte:head>
	<title>Login and Signup</title>
</svelte:head>

<svelte:window
	onkeyup={(event) => {
		const keyName = event.key;
		if (keyName === "Enter") triggerAction();
	}}
/>

<Notification
	offsetSafeArea={!(browser && inIframe())}
	onaccept={() => playSound("basic_button")}
	ondismiss={() => playSound("basic_button")}
/>

{#snippet backToLogin()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<span
		class="back-to-login"
		onclick={() => (formType = "login")}
		tabindex="0"
		role="button"
		transition:slide={{ axis: "y", duration: 150 }}
	>
		<ArrowLeft size={20} strokeWidth={2.25} style="margin-bottom: -3px;" />
		Back to start
	</span>
{/snippet}

<main>
	<!-- Captcha Popup-->
	{#if captchaVisible}
		<div class="popup-container" transition:fade={{ duration: 150 }}>
			<div class="container captcha-container" transition:scale>
				<h2 class="captcha-header">Captcha</h2>
				<div id="captcha-slot">
					<!-- Captcha will be loaded here -->
				</div>
			</div>
		</div>
	{/if}
	<!-- Center Container -->
	<div class="wrapper">
		<div class="container">
			<img class="logo" src="/img/openguessr.svg" alt="OpenGuessr Logo" />
			<div>
				<div class="input-stack">
					{#if formType == "signup"}
						<div class="container-child-margin-bottom" transition:slide={{ axis: "y", duration: 150 }}>
							<input type="text" bind:value={username} placeholder="Username" maxlength="255" />
						</div>
					{/if}
					{#if formType == "login" || formType == "signup" || formType == "reset"}
						<div transition:slide={{ axis: "y", duration: 150 }} class="container-child-margin-bottom">
							<input type="email" bind:value={email} placeholder="Email" />
						</div>
					{/if}
					{#if formType == "login" || formType == "signup" || formType == "new-password"}
						<div
							class="password-container container-child-margin-bottom"
							transition:slide={{ axis: "y", duration: 150 }}
						>
							<input
								bind:value={password}
								type={passwordInputType}
								placeholder={formType == "new-password" ? "New password" : "Password"}
							/>
							<button class="toggle-password" onclick={togglePasswordVisibility}>
								{#if passwordInputType == "text"}
									<Eye size={22} strokeWidth={2.25} />
								{:else}
									<EyeClosed size={22} strokeWidth={2.25} />
								{/if}
							</button>
						</div>
					{/if}
					{#if formType == "delete"}
						<InfoBanner
							text="This will immediately delete your account and data."
							style="margin-bottom: var(--layout-margin);"
						/>
					{/if}
					<button
						class="standard-button action-button"
						onclick={() => {
							playSound("basic_button");
							triggerAction();
						}}
						disabled={actionButtonBusy}
						>{(() => {
							if (formType == "login") return "Log in";
							if (formType == "signup") return "Sign up";
							if (formType == "reset") return "Send link";
							if (formType == "new-password") return "Set password";
							if (formType == "delete") return "Delete account";
						})()}</button
					>
				</div>
				{#if formType != "login"}
					{@render backToLogin()}
				{/if}
			</div>
		</div>
		{#if formType == "login"}
			<div class="container" transition:slide={{ axis: "y", duration: 150 }}>
				<div transition:blur={{ duration: 150 }} class="signup-options-container">
					<button
						class="standard-button bright signup-button large"
						onclick={() => {
							playSound("basic_button");
							startGoogleLogin();
						}}
					>
						<img
							src="/img/google_logo.png"
							style="width: 26px; height: 26px; background-color: white; border-radius: 100%; border: 2px solid white; user-select: none; pointer-events: none;"
							alt="Google logo"
						/>
						Continue with Google
					</button>
					<button
						class="standard-button bright signup-button large"
						onclick={() => {
							playSound("basic_button");
							startAppleLogin();
						}}
					>
						<img
							src="/img/apple_logo.png"
							style="width: 26px; height: 26px; scale: 1.25; clip-path: circle(calc(50% / 1.25)); user-select: none; pointer-events: none;"
							alt="Apple logo"
						/>
						Continue with Apple
					</button>
					<button
						class="standard-button bright signup-button large"
						onclick={() => {
							playSound("basic_button");
							formType = "signup";
						}}
					>
						<Mail size={22} strokeWidth={2.25} style="margin-bottom: -2px;" /> Sign up with email
					</button>
					<p id="privacy-notice">
						<a href="/legal" target="_blank">Legal</a>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span onclick={() => (formType = "reset")} role="button" class="reset-button" tabindex="0"
							>Reset password</span
						>
					</p>
				</div>
			</div>
		{/if}
	</div>
	<div class="orb"></div>
	<div id="second-orb" class="orb"></div>
</main>

<style>
	main {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: 0;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.captcha-header {
		margin-bottom: var(--layout-margin);
	}

	.action-button {
		margin-bottom: var(--box-margin) !important;
	}

	.signup-button {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--box-margin);
	}

	.logo {
		margin: auto;
		width: 275px;
		height: 57px;
		margin-bottom: calc(var(--layout-margin) + var(--content-margin));
		margin-top: var(--content-margin);
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.1));
		user-select: none;
		pointer-events: none;
	}

	.popup-container {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		backdrop-filter: blur(var(--normal-blur));
		background-color: var(--overlay-color);
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container {
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
		padding: var(--layout-margin);
		width: 310px;
		text-align: center;
		backdrop-filter: blur(100px);
	}

	.captcha-container {
		width: auto; /* Expand to captcha size */
	}

	.container-child-margin-bottom {
		margin-bottom: var(--layout-margin);
	}

	.signup-options-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: var(--layout-margin);
	}

	.orb {
		position: absolute;
		width: 1500px;
		height: 1200px;
		box-sizing: content-box;
		padding: 200px;
		margin: -200px;
		border-radius: 50%;
		background: radial-gradient(
			closest-side,
			rgba(255, 59, 48, 0.14),
			rgba(255, 59, 48, 0.126) 20%,
			rgba(255, 59, 48, 0.095) 40%,
			rgba(255, 59, 48, 0.053) 60%,
			rgba(255, 59, 48, 0.021) 80%,
			rgba(255, 59, 48, 0)
		);
		z-index: -1;
		top: 20%;
		overflow: hidden;
		right: 10%;
	}

	#second-orb {
		position: absolute;
		width: 900px;
		height: 1100px;
		bottom: 20%;
		left: 10%;
	}

	#privacy-notice {
		opacity: 50%;
		margin-bottom: 0;
		display: flex;
		justify-content: center;
		gap: var(--layout-margin);
	}

	#privacy-notice * {
		transition: opacity 250ms ease;
		cursor: pointer;
	}

	#privacy-notice *:hover {
		opacity: 0.5;
	}

	.reset-button {
		text-decoration: underline;
	}

	input {
		width: calc(100% - var(--layout-margin) * 2);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
	}

	.password-container {
		position: relative;
	}

	.password-container input {
		padding-right: 50px;
	}

	.back-to-login {
		opacity: 50%;
		margin-bottom: 0;
		display: flex;
		justify-content: center;
		cursor: pointer;
		align-items: center;
		transition: opacity 250ms ease;
		gap: var(--content-margin);
		margin-top: calc(var(--layout-margin) + var(--box-margin));
		margin-bottom: var(--content-margin);
		margin-left: calc(var(--box-margin) * -1);
	}

	.back-to-login:hover {
		opacity: 25%;
	}

	.toggle-password {
		position: absolute;
		right: 27px;
		top: 50%;
		transform: translateY(-50%);
		cursor: pointer;
		padding: 3px;
		height: auto;
		opacity: 0.5;
		display: flex;
		align-content: center;
	}

	.wrapper {
		padding-top: var(--box-margin);
		padding-bottom: var(--box-margin);
	}

	.wrapper > :not(:first-child) {
		margin-top: var(--layout-margin);
	}
</style>
