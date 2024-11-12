<script>
    import {
        displayError,
        loginUser,
        registerUser,
        sendPasswordResetEmail,
        changePassword,
    } from "$lib/utils/userAPI";

    import inIframe from "$lib/utils/checkIframe";

    import { onMount, onDestroy } from "svelte";

    // Toggle between login and signup ---------------------------------------------------------------------------------------------
    let loginForm;
    let signupForm;
    let resetForm;
    let newPasswordForm;

    function toggleForm() {
        signupStage = 1;
        resetForm.style.display = "none";
        newPasswordForm.style.display = "none";

        if (loginForm.style.display == "none") {
            loginForm.style.display = "block";
            signupForm.style.display = "none";
        } else {
            loginForm.style.display = "none";
            signupForm.style.display = "block";
        }
    }

    // Password reset screen -------------------------------------------------------------------------------------------------------------------------------------

    let resetEmail = $state();

    function showPasswordResetForm() {
        loginForm.style.display = "none";
        signupForm.style.display = "none";
        newPasswordForm.style.display = "none";
        resetForm.style.display = "block";
    }

    // Password reset via auth link ------------------------------------------------------------------------------------------------------------------------------

    onMount(() => {
        let urlParams = new URLSearchParams(window.location.search);
        let resetBearerToken = urlParams.get("token");

        if (resetBearerToken) {
            newPasswordForm.style.display = "block";
            loginForm.style.display = "none";
            signupForm.style.display = "none";
            resetForm.style.display = "none";
            history.replaceState({}, document.title, window.location.pathname); // reset url back to normal one
        }
    });

    let resetPasswordValue = $state("");

    function changePasswordIfValuesProvided() {
        if (resetPasswordValue) {
            changePassword(resetBearerToken, resetPasswordValue, "signup");
        } else {
            displayError("Please input a new password.", "signup");
        }
    }

    // Back to OpenGuessr Button ---------------------------------------------------------------------------------------------------------------------------------

    function backToPrevious() {
        if (inIframe()) {
            window.parent.postMessage("close", "*");
        } else {
            if (document.referrer) {
                window.history.back();
            } else {
                window.location.href = "/"; // Fallback if no referrer
            }
        }
    }

    // Signup UI Logic and Captcha ------------------------------------------------------------------------------------------------------------------------------

    let signupButtonSignupPage;

    // Back button on signup screen (return to form from captcha)
    function returnToStage1() {
        signupStage = 1;
        setSignupStage();
    }

    let signupStage = 1;

    let captcha;
    let signupArea;
    let signupBack;

    // Switch between captcha and form
    function setSignupStage() {
        signupButtonSignupPage.innerHTML = "Signup (" + signupStage + "/2)";
        if (signupStage == 2) {
            signupArea.style.display = "none";
            captcha.style.display = "block";
            signupBack.style.display = "inline";
            randomQuestion();
        } else {
            signupArea.style.display = "block";
            captcha.style.display = "none";
            signupBack.style.display = "none";
        }
    }

    onMount(() => {
        setSignupStage();
    });

    function validateEmail(email) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    // Check fields + validate email address structure
    function checkEmptyFields(isSignup) {
        if (isSignup) {
            if (
                signupUsername &&
                signupPassword &&
                validateEmail(signupEmail)
            ) {
                return true;
            } else {
                displayError("Please check your input.", "signup");
                return false;
            }
        } else {
            if (validateEmail(loginEmail) && loginPassword) {
                return true;
            } else {
                displayError(
                    "Please check your input. The first field should contain a valid email address!",
                    "signup",
                );
                return false;
            }
        }
    }

    let questions = [
        ["How many people live on Mars?", "0"],
        ["How many people live on earth (in Billion)?", "8"],
        ["How many legs does a typical dog have?", "4"],
        ["How many sides does a square have?", "4"],
        ["How many days make up one week?", "7"],
        ["How many poles does Earth have?", "2"],
        ["How many hemispheres does Earth have?", "2"],
        ["How many moons does Earth have? ", "1"],
        ["How many years make up half a decade?", "5"],
        ["How many sides does a hexagon have?", "6"],
    ];

    let randomQuestionIndex;

    let captchaHeader = $state("Default Captcha");

    function randomQuestion() {
        randomQuestionIndex = Math.floor(Math.random() * 10);
        captchaHeader = questions[randomQuestionIndex][0];
    }

    let captchaUserAnswer = $state();

    //validate answer to captcha question
    function validateQuestion() {
        if (captchaUserAnswer == questions[randomQuestionIndex][1]) {
            return true;
        } else {
            displayError("Answer incorrect :( Try again.", "signup");
            randomQuestion();
            return false;
        }
    }

    // Signup and login ----------------------------------------------------------------------------------------------------------

    let loginEmail = $state();
    let loginPassword = $state();

    let signupEmail = $state();
    let signupPassword = $state();
    let signupUsername = $state();

    let loginButtonSignupPage;

    // This is the function that runs when the user click on signup or presses enter.
    function signUpAction() {
        if (signupStage == 2 && validateQuestion()) {
            registerUser(signupUsername, signupEmail, signupPassword, "signup");
        } else {
            if (checkEmptyFields(true)) {
                signupStage = 2;
                setSignupStage();
                loginEmail = signupEmail;
            }
        }
    }

    // This is the function that runs when the user click on login or presses enter.
    async function logInAction() {
        if (checkEmptyFields(false)) {
            loginButtonSignupPage.textContent = "Wait...";
            await loginUser(loginEmail, loginPassword, "signup");
            loginButtonSignupPage.textContent = "Log in";
        }
    }

    onMount(() => {
        // Keyboard Enter
        function handleKeyUp(event) {
            const keyName = event.key;

            // Will go to the next step when pressing Enter.
            if (keyName === "Enter" && loginForm.style.display != "none") {
                logInAction();
            } else if (
                keyName === "Enter" &&
                signupForm.style.display != "none"
            ) {
                signUpAction();
            }
        }

        document.addEventListener("keyup", handleKeyUp);
    });

    onDestroy(() => {
        if (typeof window !== "undefined") {
            document.removeEventListener("keyup", handleKeyUp);
        }
    });

    // Toggle password field visability ------------

    let passwordInputType = $state("password");
    let eyeIconPath = $state("/img/eyeclosed.png");

    function togglePasswordVisibility() {
        if (passwordInputType == "password") {
            passwordInputType = "text";
            eyeIconPath = "/img/eyeopen.png";
        } else {
            passwordInputType = "password";
            eyeIconPath = "/img/eyeclosed.png";
        }
    }
</script>

<svelte:head>
    <title>Login and Signup</title>
</svelte:head>

<main>
    <div class="wrapper">
        <div class="container">
            <img class="logo" src="/img/openguessr.svg" alt="OpenGuessr Logo" />
            <div id="newPasswordForm" bind:this={newPasswordForm}>
                <div>
                    <input
                        bind:value={resetPasswordValue}
                        type="password"
                        placeholder="New Password" /><br /><br />
                    <button
                        id="changePassword"
                        class="standardButton"
                        onclick={changePasswordIfValuesProvided}
                        >Set new password</button>
                </div>
                <p class="switchFormBox">
                    Recovered Password?
                    <button
                        id="loginSwitchChange"
                        class="standardButton white"
                        onclick={toggleForm}>Log in</button>
                </p>
            </div>
            <div id="resetForm" bind:this={resetForm}>
                <div>
                    <input
                        bind:value={resetEmail}
                        type="email"
                        placeholder="Email" /><br /><br />
                    <button
                        id="reset"
                        class="standardButton"
                        onclick={() =>
                            sendPasswordResetEmail(resetEmail, "signup")}
                        >Reset</button>
                </div>
                <p class="switchFormBox">
                    Recovered Password?
                    <button
                        id="loginSwitchReset"
                        class="standardButton white"
                        onclick={toggleForm}>Log in</button>
                </p>
            </div>
            <div id="loginForm" bind:this={loginForm}>
                <div>
                    <input
                        id="login_email"
                        type="email"
                        bind:value={loginEmail}
                        placeholder="Email" /><br /><br />
                    <input
                        id="login_password"
                        type="password"
                        bind:value={loginPassword}
                        placeholder="Password" /><br /><br />
                    <button
                        id="login"
                        class="standardButton"
                        bind:this={loginButtonSignupPage}
                        onclick={logInAction}>Log in</button>
                </div>
                <p class="switchFormBox">
                    No Account yet?
                    <button
                        id="loginSwitch"
                        class="standardButton white"
                        onclick={toggleForm}>Sign up</button>
                </p>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <p id="passwordResetOption" onclick={showPasswordResetForm}>
                    Forgot password?
                </p>
            </div>
            <div id="signupForm" style="display: none;" bind:this={signupForm}>
                <div>
                    <div id="signup_area" bind:this={signupArea}>
                        <input
                            id="signup_username"
                            type="text"
                            bind:value={signupUsername}
                            placeholder="Username" /><br /><br />
                        <input
                            id="signup_email"
                            type="email"
                            bind:value={signupEmail}
                            placeholder="Email" /><br /><br />
                        <div class="password-container">
                            <input
                                id="signup_password"
                                bind:value={signupPassword}
                                type={passwordInputType}
                                placeholder="Password" />
                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <img
                                class="toggle-password"
                                onclick={togglePasswordVisibility}
                                src={eyeIconPath}
                                alt="Show Password" />
                        </div>
                    </div>
                    <div id="captcha" bind:this={captcha}>
                        <h2
                            id="captchaHeader"
                            bind:textContent={captchaHeader}
                            contenteditable="false">
                            Can you answer the default question?
                        </h2>
                        <input
                            id="captchaAnswer"
                            type="number"
                            bind:value={captchaUserAnswer}
                            min="0"
                            max="10"
                            placeholder="0 - 10" /><br /><br />
                    </div>
                    <button
                        id="back"
                        class="standardButton"
                        onclick={returnToStage1}
                        bind:this={signupBack}>back</button>
                    <button
                        id="signup"
                        class="standardButton"
                        bind:this={signupButtonSignupPage}
                        onclick={signUpAction}>Sign Up (1/2)</button>
                </div>
                <p class="switchFormBox">
                    Already signed up?
                    <button
                        id="loginSwitchBack"
                        class="standardButton white"
                        onclick={toggleForm}>Login</button>
                </p>
                <p id="privacyNotice">
                    Our <a href="/legal">policies</a> apply.
                </p>
            </div>
            <p id="errorMessage">This is an error message box.</p>
        </div>
        <div class="container containerBottom">
            <button
                id="backButton"
                onclick={backToPrevious}
                class="standardButton white">⭠ Go Back</button>
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
        font-size: 20px;
        font-weight: 400;
        background-color: #07071e;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    .logo {
        margin: auto;
        width: 275px;
        height: 57px;
        margin-bottom: 30px;
        margin-top: 5px;
    }

    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        width: 300px;
        text-align: center;
        backdrop-filter: blur(1000px);
    }

    .orb {
        position: absolute;
        width: 1500px;
        height: 1200px;
        border-radius: 50%;
        background-color: rgba(255, 59, 48, 0.15);
        filter: blur(1500px);
        -webkit-filter: blur(1500px);
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

    #captchaAnswer {
        color: black;
        background-color: rgba(255, 255, 255, 0.8);
        width: 30%;
        text-align: center;
    }

    #captchaHeader {
        padding: 10px;
        padding-bottom: 15px;
        margin: 0;
        margin-bottom: 30px;
        text-wrap: wrap;
        font-size: 24px;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 5px;
        color: rgba(42, 44, 71, 1);
        margin-left: 34px;
        margin-right: 34px;
    }

    #errorMessage {
        color: red;
        display: inline;
        transition:
            max-height 250ms ease,
            opacity 250ms ease,
            margin 250ms ease;
        overflow: hidden;
        max-height: 0px;
        margin: 0;
        opacity: 0;
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

    #back {
        background-color: white;
        color: black;
    }

    #privacyNotice {
        opacity: 50%;
        margin-bottom: 0;
        margin-top: 20px;
    }

    input {
        color: white;
        background: rgba(55, 27, 31, 0.35);
        transition: background-color 250ms ease;
        border-radius: 5px;
        font-size: 18px;
        padding: 15px;
        outline: none;
        box-shadow: none;
        border: none;
        font-family: Barlow;
        width: calc(80% - 20px);
    }

    input::placeholder {
        color: white;
        opacity: 0.5;
    }

    .password-container {
        position: relative;
        margin-bottom: 20px;
    }

    .switchFormBox {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        min-width: 250px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 8px;
        padding-inline: 16px;
        padding-right: 8px;
        margin-top: 50px;
    }

    .toggle-password {
        position: absolute;
        right: -14px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        width: 30px;
        height: auto;
        opacity: 0.75;
    }

    .wrapper {
        padding-top: 10px;
        padding-bottom: 10px;
    }

    #backButton {
        margin: 0;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 7px;
        width: 100%;
        min-height: 50px;
    }

    .containerBottom {
        margin-top: 10px;
        padding: 5px;
        min-width: 330px;
    }

    #resetForm,
    #newPasswordForm {
        display: none;
    }

    #passwordResetOption {
        color: rgba(255, 255, 255, 0.5);
        transition: color 250ms ease;
        font-size: 20px;
        cursor: pointer;
        border-radius: 5px;
        width: 100%;
        margin-bottom: 0;
        margin-top: 20px;
        user-select: none;
    }

    #passwordResetOption:hover {
        color: rgba(255, 255, 255, 1);
    }

    #captchaAnswer::placeholder {
        color: black;
    }
</style>
