<script>
	import { displayError, loginUser, registerUser, sendPasswordResetEmail, changePassword } from "$lib/logic/accountAPI";
	import { Eye, EyeClosed } from "lucide-svelte";
	import { renderCaptcha } from "$lib/utils/renderCaptcha";
	import inIframe from "$lib/utils/checkIframe";
	import { onMount } from "svelte";
	import { fade, scale, slide } from "svelte/transition";
	import { signupMessageColor, signupMessageShown, signupMessageText } from "$lib/stores/context-specific/signupStore";

	// Export error / success functions --------------------------------------------------------------------------------------------------------------
	let timeout;

	function displaySuccess(text) {
		try {
			clearTimeout(timeout);
			signupMessageText.set(text);
			signupMessageColor.set("#64c681");
			signupMessageShown.set(true);
			formType = "login"; // Change to log in

			// Hide error again
			timeout = setTimeout(() => {
				signupMessageShown.set(false);
			}, 4000);
		} catch (error) {
			console.error("Error occured displaying success:", error);
		}
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
		if (resetPasswordValue) changePassword(resetBearerToken, resetPasswordValue, "signup", displaySuccess);
		else displayError("Please input a new password.", "signup");
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
				displayError("Please check your input.", "signup");
				return false;
			}
		} else {
			if (validateEmail(loginEmail) && loginPassword) {
				return true;
			} else {
				displayError("Please check your input. The first field should contain a valid email address!", "signup");
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
			await loginUser(loginEmail, loginPassword, "signup");
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
			registerUser(signupUsername, signupEmail, signupPassword, token, "signup", displaySuccess);
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
						<button
							id="reset"
							class="standardButton"
							onclick={() => sendPasswordResetEmail(resetEmail, "signup", displaySuccess)}>Reset</button
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
			{#if $signupMessageShown}
				<p class="errorMessage" transition:slide={{ axis: "y" }} style:color={$signupMessageColor}>
					{$signupMessageText}
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
		box-shadow: var(--button-shadow);
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
