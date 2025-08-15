<script>
	import { Eye, EyeClosed } from "lucide-svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import inIframe from "$lib/utils/checkIframe";
	import { onMount } from "svelte";
	import { fade, scale, slide } from "svelte/transition";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { goto } from "$app/navigation";

	let signupMessageColor = $state("white");
	let signupMessageShown = $state(false);
	let signupMessageText = $state("Empty");
	let signupMessageTimeout = $state();

	// API requests -------------------------------------------------------------------------------------------------------
	async function loginUser(email, password) {
		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$accountUrl}/accounts/login`, {
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

				if (inIframe()) {
					window.parent.postMessage("loadAccountStatus", "*");
					window.parent.postMessage(`id ${data["id"]}`, "*");
					window.parent.postMessage(`token ${data["token"]}`, "*");
					window.parent.postMessage("close", "*");
				} else {
					if (document.referrer) window.history.back();
					else goto("/"); // Fallback if no referrer
				}
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
			displayError("Login failed", error.message);
		}
	}

	async function registerUser(userName, email, password, captchaToken, successFunction) {
		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$accountUrl}/accounts/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"cf-turnstile-response": captchaToken,
				},
				body: JSON.stringify({ userName: userName, email, password }),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				if (typeof successFunction == "function") successFunction?.("Registration successful!");
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
			displayError("Registration failed", error.message);
		}
	}

	// Send reset email
	async function sendPasswordResetEmail(email, successFunction) {
		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$accountUrl}/accounts/reset-password-request`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				if (typeof successFunction != "function") return;
				successFunction?.("Password reset email sent!");
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Sending password reset request failed:", error);
			displayError("Password reset request failed", error.message);
		}
	}

	// Change password with reset token
	async function changePassword(token, newPassword, successFunction) {
		try {
			// Make the POST request using Fetch API
			const response = await fetch(`${$accountUrl}/accounts/reset-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, newPassword }),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				if (typeof successFunction != "function") return;
				successFunction?.("Password changed successfully!");
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Password change failed:", error);
			displayError("Password change failed", error.message);
		}
	}

	// Export error / success functions --------------------------------------------------------------------------------------------------------------
	function displaySuccess(text) {
		try {
			clearTimeout(signupMessageTimeout);
			signupMessageText = text;
			signupMessageColor = "#64c681";
			signupMessageShown = true;
			formType = "login"; // Change to log in

			// Hide error again
			signupMessageTimeout = setTimeout(() => {
				signupMessageShown = false;
			}, 4000);
		} catch (error) {
			console.error("Error occured displaying success:", error);
		}
	}

	function displayError(errorTitle = "", errorMsg = "") {
		clearTimeout(signupMessageTimeout);
		signupMessageShown = true;
		signupMessageColor = "#ffaeae";
		signupMessageText = errorTitle + (errorMsg ? " – " + errorMsg : "");

		signupMessageTimeout = setTimeout(() => {
			signupMessageShown = false;
		}, 7000);
	}

	// Toggle between login, signup, newPassword and reset ---------------------------------------------------------------------------------------------
	let formType = $state("login");

	// Password reset ----------------------------------------------------------------------------------------------------------------------------------
	let resetEmail = $state();
	let resetBearerToken;

	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);
		resetBearerToken = urlParams.get("token");

		if (resetBearerToken) {
			formType = "newPassword";
			history.replaceState({}, document.title, window.location.pathname); // reset url back to normal one
		}
	});

	let resetPasswordValue = $state("");

	function changePasswordIfValuesProvided() {
		if (resetPasswordValue) changePassword(resetBearerToken, resetPasswordValue, displaySuccess);
		else displayError("Please input a new password.");
	}

	// Signup UI Logic and Captcha ------------------------------------------------------------------------------------------------------------------------------
	let signupButtonSignupPage = $state();
	let signupArea = $state();

	function validateEmail(email) {
		var re = /\S+@\S+\.\S+/;
		return re.test(email);
	}

	// Check fields + validate email address structure
	function checkEmptyFields(isSignup) {
		if (isSignup) {
			if (signupUsername && signupPassword && validateEmail(signupEmail)) {
				return true;
			} else {
				displayError("Please check your input.");
				return false;
			}
		} else {
			if (validateEmail(loginEmail) && loginPassword) {
				return true;
			} else {
				displayError("Please check your input. The first field should contain a valid email address!");
				return false;
			}
		}
	}

	// Signup and login ----------------------------------------------------------------------------------------------------------
	let loginEmail = $state();
	let loginPassword = $state();

	let signupEmail = $state();
	let signupPassword = $state();
	let signupUsername = $state();

	let loginButtonSignupPage = $state();
	let captchaVisible = $state(false);

	// This is the function that runs when the user click on signup or presses enter.
	function signUpAction() {
		if (checkEmptyFields(true)) captchaVisible = true;
	}

	// This is the function that runs when the user click on login or presses enter.
	async function logInAction() {
		if (checkEmptyFields(false)) {
			loginButtonSignupPage.textContent = "Wait...";
			await loginUser(loginEmail, loginPassword);
			loginButtonSignupPage.textContent = "Log in";
		}
	}

	function handleKeyUp(event) {
		const keyName = event.key;

		// Will go to the next step when pressing Enter.
		if (keyName === "Enter" && formType == "login") {
			logInAction();
		} else if (keyName === "Enter" && formType == "signup") {
			signUpAction();
		}
	}

	$effect(() => {
		if (captchaVisible) renderCaptcha("#captchaContainer", window.onSignupTurnstileCompleted);
	});

	if (typeof window !== "undefined") {
		window.onSignupTurnstileCompleted = function (token) {
			registerUser(signupUsername, signupEmail, signupPassword, token, displaySuccess);
			loginEmail = signupEmail;
			captchaVisible = false;
		};
	}

	// Toggle password field visability ----------------------------------------------------
	let passwordInputType = $state("password");

	function togglePasswordVisibility() {
		passwordInputType = passwordInputType == "password" ? "text" : "password";
	}
</script>

<svelte:head>
	<title>Login and Signup</title>
</svelte:head>

<svelte:window on:keyup={handleKeyUp} />

<main>
	<!-- Captcha Popup-->
	{#if captchaVisible}
		<div class="popupContainer" transition:fade={{ duration: 150 }}>
			<div class="container neumorphic-menu" transition:scale>
				<h2 class="captchaHeader">Captcha</h2>
				<div id="captchaContainer">
					<!-- Captcha will be loaded here -->
				</div>
			</div>
		</div>
	{/if}
	<!-- Center Container -->
	<div class="wrapper">
		<div class="container neumorphic-menu">
			<img class="logo" src="/img/openguessr.svg" alt="OpenGuessr Logo" />
			{#if formType == "newPassword"}
				<div id="newPasswordForm">
					<div class="flex-input-box">
						<input bind:value={resetPasswordValue} type="password" placeholder="New Password" />
						<button id="changePassword" class="standardButton" onclick={changePasswordIfValuesProvided}
							>Set new password</button
						>
					</div>
					<p class="switchFormBox">
						Remembered?
						<button
							id="loginSwitchChange"
							class="standardButton white"
							onclick={() => {
								formType = "login";
							}}>Log in</button
						>
					</p>
				</div>
			{/if}
			{#if formType == "reset"}
				<div id="resetForm">
					<div class="flex-input-box">
						<input bind:value={resetEmail} type="email" placeholder="Email" />
						<button id="reset" class="standardButton" onclick={() => sendPasswordResetEmail(resetEmail, displaySuccess)}
							>Reset</button
						>
					</div>
					<p class="switchFormBox">
						Remembered?
						<button
							id="loginSwitchReset"
							class="standardButton white"
							onclick={() => {
								formType = "login";
							}}>Log in</button
						>
					</p>
				</div>
			{/if}
			{#if formType == "login"}
				<div id="loginForm">
					<div class="flex-input-box">
						<input id="login_email" type="email" bind:value={loginEmail} placeholder="Email" />
						<input id="login_password" type="password" bind:value={loginPassword} placeholder="Password" />
						<button id="login" class="standardButton" bind:this={loginButtonSignupPage} onclick={logInAction}
							>Log in</button
						>
					</div>
					<p class="switchFormBox">
						No account yet?
						<button
							id="loginSwitch"
							class="standardButton white"
							onclick={() => {
								formType = "signup";
							}}>Sign up</button
						>
					</p>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						id="passwordResetOption"
						onclick={() => {
							formType = "reset";
						}}
					>
						Forgot password?
					</p>
				</div>
			{/if}
			{#if formType == "signup"}
				<div id="signupForm">
					<div>
						<div class="flex-input-box" id="signup_area" bind:this={signupArea}>
							<input id="signup_username" type="text" bind:value={signupUsername} placeholder="Username" />
							<input id="signup_email" type="email" bind:value={signupEmail} placeholder="Email" />
							<div class="password-container">
								<input
									id="signup_password"
									bind:value={signupPassword}
									type={passwordInputType}
									placeholder="Password"
								/>
								<!-- svelte-ignore a11y_consider_explicit_label -->
								<button class="toggle-password" onclick={togglePasswordVisibility}>
									{#if passwordInputType == "text"}
										<Eye />
									{:else}
										<EyeClosed />
									{/if}
								</button>
							</div>
							<button id="signup" class="standardButton" bind:this={signupButtonSignupPage} onclick={signUpAction}
								>Sign up</button
							>
						</div>
					</div>
					<p class="switchFormBox">
						Already signed up?
						<button
							id="loginSwitchBack"
							class="standardButton white"
							onclick={() => {
								formType = "login";
							}}>Log in</button
						>
					</p>
					<p id="privacyNotice">
						Our <a href="/legal" target="_blank">policies</a> apply.
					</p>
				</div>
			{/if}
			{#if signupMessageShown}
				<p class="errorMessage" transition:slide={{ axis: "y" }} style:color={signupMessageColor}>
					{signupMessageText}
				</p>
			{/if}
		</div>
	</div>
	<div class="orb"></div>
	<div id="secondOrb" class="orb"></div>
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

	.neumorphic-menu {
		box-shadow:
			0 0 20px rgba(0, 0, 0, 0.3),
			inset 0 0.075rem 0 hsla(0, 0%, 100%, 0.2),
			inset 0 -0.1rem 0 rgba(0, 0, 0, 0.15) !important;
	}

	.captchaHeader {
		margin-bottom: 15px;
	}

	.logo {
		margin: auto;
		width: 275px;
		height: 57px;
		margin-bottom: 30px;
		margin-top: 5px;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.1));
	}

	.popupContainer {
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
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 15px;
		padding: 20px;
		width: 280px;
		text-align: center;
		backdrop-filter: blur(100px);
	}

	.flex-input-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--layout-margin);
	}

	.orb {
		position: absolute;
		width: 1500px;
		height: 1200px;
		border-radius: 50%;
		background: radial-gradient(rgba(255, 59, 48, 0.15), rgba(0, 0, 0, 0));
		filter: blur(12vw);
		-webkit-filter: blur(12vw);
		z-index: -1;
		top: 20%;
		overflow: hidden;
		right: 10%;
	}

	#secondOrb {
		position: absolute;
		width: 900px;
		height: 1100px;
		bottom: 20%;
		left: 10%;
	}

	.errorMessage {
		display: inline;
		overflow: hidden;
		margin-top: var(--layout-margin);
		margin-bottom: var(--layout-margin);
	}

	@keyframes floatOrb {
		0% {
			transform: translateY(0) translateX(0);
			opacity: 0.05;
		}

		50% {
			transform: translateY(-200px) translateX(200px);
			opacity: 0.025;
		}

		100% {
			transform: translateY(0) translateX(-200px);
			opacity: 0.05;
		}
	}

	#privacyNotice {
		opacity: 50%;
		margin-bottom: 0;
		margin-top: var(--layout-margin);
	}

	input {
		width: calc(80% - 20px);
		padding: 15px;
		border-radius: 10px;
	}

	.password-container {
		position: relative;
		width: 100%;
	}

	.switchFormBox {
		display: flex;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
		align-items: center;
		justify-content: space-between;
		min-width: 250px;
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		padding: var(--box-margin);
		padding-left: calc(var(--box-margin) + var(--panel-margin));
		margin-top: 50px;
	}

	.toggle-password {
		position: absolute;
		right: -16px;
		top: 50%;
		transform: translateY(-50%);
		cursor: pointer;
		width: 30px;
		height: auto;
		opacity: 0.5;
		color: white;
		display: flex;
		align-content: center;
	}

	.wrapper {
		padding-top: 10px;
		padding-bottom: 10px;
	}

	#passwordResetOption {
		color: rgba(255, 255, 255, 0.5);
		transition: color 250ms ease;
		cursor: pointer;
		border-radius: 5px;
		width: 100%;
		margin-bottom: 0;
		margin-top: var(--layout-margin);
		user-select: none;
	}

	#passwordResetOption:hover {
		color: rgba(255, 255, 255, 1);
	}
</style>
