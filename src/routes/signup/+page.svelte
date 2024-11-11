<script>
    import {
        displayError,
        loginUser,
        registerUser,
        sendPasswordResetEmail,
        changePassword,
    } from "$lib/utils/userAPI";

    // Toggle between login and signup ---------------------------------------------------------------------------------------------
    let loginForm = document.getElementById("loginForm");
    let signupForm = document.getElementById("signupForm");
    let resetForm = document.getElementById("resetForm");
    let newPasswordForm = document.getElementById("newPasswordForm");

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

    let loginSwitch = document.getElementById("loginSwitch");
    loginSwitch.addEventListener("click", toggleForm);

    let loginSwitchReset = document.getElementById("loginSwitchReset");
    loginSwitchReset.addEventListener("click", toggleForm);

    let loginSwitchChange = document.getElementById("loginSwitchChange");
    loginSwitchChange.addEventListener("click", toggleForm);

    let loginSwitchBack = document.getElementById("loginSwitchBack");
    loginSwitchBack.addEventListener("click", toggleForm);

    function inIframe() {
        try {
            return window.self !== window.parent;
        } catch (e) {
            return true;
        }
    }

    // Password reset screen -------------------------------------------------------------------------------------------------------------------------------------

    document
        .getElementById("passwordResetOption")
        .addEventListener("click", () => {
            loginForm.style.display = "none";
            signupForm.style.display = "none";
            newPasswordForm.style.display = "none";
            resetForm.style.display = "block";
        });

    document.getElementById("reset").addEventListener("click", () => {
        const email = document.getElementById("reset_email").value;
        sendPasswordResetEmail(email, "signup");
    });

    // Password reset via auth link ------------------------------------------------------------------------------------------------------------------------------

    let urlParams = new URLSearchParams(window.location.search);
    let resetBearerToken = urlParams.get("token");

    if (resetBearerToken) {
        newPasswordForm.style.display = "block";
        loginForm.style.display = "none";
        signupForm.style.display = "none";
        resetForm.style.display = "none";
        history.replaceState({}, document.title, window.location.pathname); // reset url back to normal one
    }

    document.getElementById("changePassword").addEventListener("click", () => {
        if (document.getElementById("reset_password").value != "") {
            changePassword(
                resetBearerToken,
                document.getElementById("reset_password").value,
                "signup",
            );
        } else {
            displayError("Please input a new password.", "signup");
        }
    });

    // Back to OpenGuessr Button ---------------------------------------------------------------------------------------------------------------------------------

    document
        .getElementById("backButton")
        .addEventListener("click", function () {
            if (inIframe()) {
                window.parent.postMessage("close", "*");
            } else {
                if (document.referrer) {
                    window.history.back();
                } else {
                    window.location.href = "/"; // Fallback if no referrer
                }
            }
        });

    // Signup UI Logic and Captcha ------------------------------------------------------------------------------------------------------------------------------

    //back button on signup screen (return to form from captcha)
    document.getElementById("back").addEventListener("click", function () {
        signupStage = 1;
        setSignupStage();
    });

    let signupStage = 1;

    setSignupStage();

    //switch between captcha and form
    function setSignupStage() {
        document.getElementById("signup").innerHTML =
            "Signup (" + signupStage + "/2)";
        if (signupStage == 2) {
            document.getElementById("signup_area").style.display = "none";
            document.getElementById("captcha").style.display = "block";
            document.getElementById("back").style.display = "inline";
            randomQuestion();
        } else {
            document.getElementById("signup_area").style.display = "block";
            document.getElementById("captcha").style.display = "none";
            document.getElementById("back").style.display = "none";
        }
    }

    function validateEmail(email) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    //check fields + validate email address structure
    function checkEmptyFields(isSignup) {
        if (isSignup) {
            if (
                document.getElementById("signup_username").value != "" &&
                document.getElementById("signup_password").value != "" &&
                validateEmail(document.getElementById("signup_email").value)
            ) {
                return true;
            } else {
                displayError("Please check your input.", "signup");
                return false;
            }
        } else {
            if (
                validateEmail(document.getElementById("login_email").value) &&
                document.getElementById("login_password").value != ""
            ) {
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

    function randomQuestion() {
        randomQuestionIndex = Math.floor(Math.random() * 10);
        document.getElementById("captchaHeader").innerHTML =
            questions[randomQuestionIndex][0];
    }

    //validate answer to captcha question
    function validateQuestion() {
        if (
            document.getElementById("captchaQuestion").value ==
            questions[randomQuestionIndex][1]
        ) {
            return true;
        } else {
            displayError("Answer incorrect :( Try again.", "signup");
            randomQuestion();
            return false;
        }
    }

    //Signup and login ----------------------------------------------------------------------------------------------------------

    let loginEmail = document.getElementById("login_email");
    let loginPassword = document.getElementById("login_password");

    let signupEmail = document.getElementById("signup_email");
    let signupPassword = document.getElementById("signup_password");
    let signupUsername = document.getElementById("signup_username");

    let loginButtonSignupPage = document.getElementById("login");
    loginButtonSignupPage.addEventListener("click", logInAction);

    let signupButtonSignupPage = document.getElementById("signup");
    signupButtonSignupPage.addEventListener("click", signUpAction);

    //this is the function that runs when the user click on signup or presses enter.
    function signUpAction() {
        if (signupStage == 2 && validateQuestion()) {
            registerUser(
                signupUsername.value,
                signupEmail.value,
                signupPassword.value,
                "signup",
            );
        } else {
            if (checkEmptyFields(true)) {
                signupStage = 2;
                setSignupStage();
                loginEmail.value = signupEmail.value;
            }
        }
    }

    //this is the function that runs when the user click on login or presses enter.
    async function logInAction() {
        if (checkEmptyFields(false)) {
            loginButtonSignupPage.textContent = "Wait...";
            await loginUser(loginEmail.value, loginPassword.value, "signup");
            loginButtonSignupPage.textContent = "Log in";
        }
    }

    //keyboard controls / enter --> next step
    document.addEventListener(
        "keyup",
        (event) => {
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
        },
        false,
    );

    // Toggle password field visability ------------
    document
        .querySelector(".toggle-password")
        .addEventListener("click", function () {
            const passwordInput = document.getElementById("signup_password");
            const icon = this;

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("hide-eye");
                icon.classList.add("show-eye");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("show-eye");
                icon.classList.add("hide-eye");
            }
        });
</script>

<svelte:head>
    <title>Login and Signup</title>
</svelte:head>

<div class="wrapper">
    <div class="container">
        <img class="logo" src="/IMG/openguessr.svg" alt="OpenGuessr Logo" />
        <div id="newPasswordForm">
            <div>
                <input
                    id="reset_password"
                    type="password"
                    placeholder="New Password" /><br /><br />
                <button id="changePassword" class="primaryButton"
                    >Set new password</button>
            </div>
            <p class="switchFormBox">
                Remembered Password?
                <button id="loginSwitchChange" class="secondaryButton"
                    >Log in</button>
            </p>
        </div>
        <div id="resetForm">
            <div>
                <input
                    id="reset_email"
                    type="email"
                    placeholder="Email" /><br /><br />
                <button id="reset" class="primaryButton">Reset</button>
            </div>
            <p class="switchFormBox">
                Remembered password?
                <button id="loginSwitchReset" class="secondaryButton"
                    >Log in</button>
            </p>
        </div>
        <div id="loginForm">
            <div>
                <input
                    id="login_email"
                    type="email"
                    placeholder="Email" /><br /><br />
                <input
                    id="login_password"
                    type="password"
                    placeholder="Password" /><br /><br />
                <button id="login" class="primaryButton">Log in</button>
            </div>
            <p class="switchFormBox">
                Don't have an account?
                <button id="loginSwitch" class="secondaryButton"
                    >Sign up</button>
            </p>
            <p id="passwordResetOption">Forgot password?</p>
        </div>
        <div id="signupForm" style="display: none;">
            <div>
                <div id="signup_area">
                    <input
                        id="signup_username"
                        type="text"
                        placeholder="Username" /><br /><br />
                    <input
                        id="signup_email"
                        type="email"
                        placeholder="Email" /><br /><br />
                    <div class="password-container">
                        <input
                            id="signup_password"
                            type="password"
                            placeholder="Password" />
                        <img
                            class="toggle-password"
                            src="/IMG/eyeclosed.png"
                            alt="Show Password" />
                    </div>
                </div>
                <div id="captcha">
                    <h2 id="captchaHeader">
                        Can you answer the default question?
                    </h2>
                    <input
                        id="captchaQuestion"
                        type="number"
                        min="0"
                        max="10"
                        placeholder="0 - 10" /><br /><br />
                </div>
                <button id="back" class="primaryButton">back</button>
                <button id="signup" class="primaryButton">Sign Up (1/2)</button>
            </div>
            <p class="switchFormBox">
                Already have an account?
                <button id="loginSwitchBack" class="secondaryButton"
                    >Login</button>
            </p>
            <p id="privacyNotice">
                Our <a href="/legal.html">policies</a> apply.
            </p>
        </div>
        <p id="errorMessage">This is an error message box.</p>
    </div>
    <div class="container containerBottom">
        <button id="backButton" class="secondaryButton">⭠ Go Back</button>
    </div>
</div>
<div class="orb"></div>
<div id="secondOrb" class="orb"></div>

<style>
    @font-face {
        font-family: Barlow;
        src: url("/FONTS/BarlowCondensed-Medium.ttf");
    }

    h1,
    h2,
    h3 {
        font-weight: 400;
    }

    p {
        color: white;
    }

    body {
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
        /* removes everything that is not in visible screen area, this way, it is no longer scrollable */
        overflow: hidden;
    }

    #title1,
    #title2 {
        color: rgba(42, 44, 71, 1);
        font-size: 24px;
        background-color: rgba(255, 255, 255, 0.5);
        border-radius: 5px;
        padding: 5px;
        width: 75%;
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

    button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin: 5px;
    }

    .primaryButton {
        transition: filter 250ms ease;
        background-color: #ff0808;
        color: white;
        cursor: pointer;
        width: fit-content;
        font-size: 22px;
        font-family: Barlow;
        padding: 5px 15px;
        text-align: center;
        white-space: nowrap;
        margin: 2.5px;
        border-radius: 5px;
        user-select: none;
        -webkit-user-select: none;
    }

    .primaryButton:hover {
        filter: brightness(70%);
    }

    .orb {
        position: absolute;
        width: 1500px;
        height: 1200px;
        border-radius: 50%;
        background-color: rgba(255, 59, 48, 0.15);
        /* Red-ish color with decreased opacity */
        filter: blur(1500px);
        /* Blurry effect */
        -webkit-filter: blur(1500px);
        /* Safari compatibility */
        z-index: -1;
        /* Ensure orbs are below other content */
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

    #captchaQuestion {
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

    .secondaryButton {
        transition: filter 250ms ease;
        background-color: white;
        color: black;
        cursor: pointer;
        width: fit-content;
        font-size: 20px;
        font-family: Barlow;
        padding: 5px 15px;
        text-align: center;
        white-space: nowrap;
        margin: 2.5px;
        margin-left: 10px;
        border-radius: 5px;
        user-select: none;
        -webkit-user-select: none;
    }

    #back {
        background-color: white;
        color: black;
    }

    .secondaryButton:hover {
        filter: brightness(70%);
    }

    a:link {
        color: #ffffff;
    }

    a:visited {
        color: #ffffff;
    }

    a:hover {
        color: #ffffff;
    }

    #privacyNotice {
        opacity: 50%;
        margin-bottom: 0;
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

    textarea:focus,
    input:focus {
        outline: none;
        background: rgba(55, 27, 31, 0.5);
    }

    .password-container {
        position: relative;
        margin-bottom: 20px;
    }

    .switchFormBox {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 8px;
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

    .toggle-password.hide-eye {
        content: url("/IMG/eyeclosed.png");
    }

    .toggle-password.show-eye {
        content: url("/IMG/eyeopen.png");
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
        user-select: none;
    }

    #passwordResetOption:hover {
        color: rgba(255, 255, 255, 1);
    }

    #captchaQuestion::placeholder {
        color: black;
    }
</style>
