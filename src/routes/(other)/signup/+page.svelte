<script>
	import { ArrowLeft, Eye, EyeClosed, Mail } from "@lucide/svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import inIframe from "$lib/utils/checkIframe";
	import { onMount } from "svelte";
	import { blur, fade, scale, slide } from "svelte/transition";
	import { apiUrl, googleOauthClientId } from "$lib/stores/context-specific/apiConfigStore";
	import { goto } from "$app/navigation";
	import Notification from "$lib/components/Notification.svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";

	let actionButtonBusy = $state(false);

	function notifyIframeParent(id, token) {
		window.parent.postMessage("loadAccountStatus", "*");
		window.parent.postMessage(`id ${id}`, "*");
		window.parent.postMessage(`token ${token}`, "*");
		window.parent.postMessage("close", "*");
	}

	// Google OAuth --------------------------------------------------------------------------------------------------------
	function startGoogleLogin() {
		const params = new URLSearchParams({
			client_id: $googleOauthClientId,
			redirect_uri: window.location.origin + window.location.pathname,
			response_type: "code",
			scope: "openid email profile",
			prompt: "select_account",
		});
		window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, "google-oauth", "width=500,height=600");

		// Listen for success message from the popup after Google callback completes
		window.addEventListener("message", function onGoogleSuccess(event) {
			if (event.data?.type !== "google-oauth-success") return;
			window.removeEventListener("message", onGoogleSuccess);

			// Token/id are already in localStorage (written by the popup, same origin)
			if (inIframe()) notifyIframeParent(localStorage.getItem("id"), localStorage.getItem("bearer"));
			else goto("/");
		});
	}

	async function handleGoogleCallback(code) {
		actionButtonBusy = true;

		try {
			const response = await fetch(`${$apiUrl}/accounts/google-authenticate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, redirectUri: window.location.origin + window.location.pathname }),
			});

			if (response.ok) {
				const data = await response.json();

				if (data["token"] && data["id"]) {
					localStorage.setItem("bearer", data["token"]);
					localStorage.setItem("id", data["id"]);
				}

				// This page loads inside a popup opened by startGoogleLogin()
				// The opener may be the /signup page directly, or an iframe embedding it
				if (window.opener) window.opener.postMessage({ type: "google-oauth-success" }, "*");
				window.close();
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Google login failed:", error);
			showNotification(error.message);
		} finally {
			actionButtonBusy = false;
		}
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const googleCode = params.get("code");
		if (googleCode) {
			history.replaceState({}, document.title, window.location.pathname);
			handleGoogleCallback(googleCode);
		} else if (params.has("error")) {
			window.close();
		}
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

	// Toggle between login, signup, newPassword and reset ---------------------------------------------------------------------------------------------
	let formType = $state("login");

	// Password reset ----------------------------------------------------------------------------------------------------------------------------------
	let resetBearerToken;

	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);
		resetBearerToken = urlParams.get("token");
		const resetPresent = urlParams.get("reset");

		if (resetBearerToken) {
			formType = "new-password";
			history.replaceState({}, document.title, window.location.pathname); // Reset url to remove query
		} else if (resetPresent) {
			formType = "reset";
			history.replaceState({}, document.title, window.location.pathname);
		}
	});

	function changePasswordIfValuesProvided(newPassword) {
		if (newPassword) changePassword(resetBearerToken, newPassword);
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
		if (captchaVisible) renderCaptcha("#captchaContainer", window.onSignupTurnstileCompleted);
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

<Notification />

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
				<h2 class="captchaHeader">Captcha</h2>
				<div id="captchaContainer">
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
					<button
						class="standardButton action-button"
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
						class="standardButton white signup-button largeButton"
						onclick={() => {
							playSound("basic_button");
							startGoogleLogin();
						}}
					>
						<img
							src="/img/google_logo.png"
							style="width: 22px; height: 22px; background-color: white; border-radius: 100%; border: 2px solid white;"
							alt="Google logo"
						/>
						Continue with Google
					</button>
					<button
						class="standardButton white signup-button largeButton"
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
	p {
		color: white;
	}

	main {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: 0;
		padding: 0;
		font-family: Barlow, Futura, Arial, sans-serif;
		font-weight: 400;
		background-color: #07071e;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.captchaHeader {
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
	}

	.popup-container {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		backdrop-filter: blur(10px);
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container {
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: var(--box-shadow);
		border-radius: var(--layout-margin);
		padding: var(--layout-margin);
		width: 280px;
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
		border-radius: 50%;
		background: radial-gradient(rgba(255, 59, 48, 0.15), rgba(0, 0, 0, 0));
		filter: blur(300px);
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
		box-sizing: border-box;
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
		color: white;
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
