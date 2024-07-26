import { displayError, loginUser, registerUser, sendPasswordResetEmail, changePassword } from "./userAPI.js"

//toggle between login and signup ---------------------------------------------------------------------------------------------
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
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}

// Password reset screen -------------------------------------------------------------------------------------------------------------------------------------

document.getElementById("passwordResetOption").addEventListener("click" , () => {
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
    changePassword(resetBearerToken, document.getElementById("reset_password").value, "signup");
  } else {
    displayError("Please input a new password.", "signup");
  }
});

// Back to OpenGuessr Button ---------------------------------------------------------------------------------------------------------------------------------

document.getElementById("backButton").addEventListener("click",
  function () {
      if (inIframe()) {
          window.top.postMessage("close", "*");
      } else {
          window.location.href = "/index.html";
      }
  }
);


// Signup UI Logic and Captcha ------------------------------------------------------------------------------------------------------------------------------

//back button on signup screen (return to form from captcha)
document.getElementById("back").addEventListener("click", function() {
  signupStage = 1;
  setSignupStage();
})

let signupStage = 1;

setSignupStage();

//switch between captcha and form
function setSignupStage() {
  document.getElementById("signup").innerHTML = "Signup (" + signupStage + "/2)";
  if (signupStage == 2){
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
  if (document.getElementById("signup_username").value != "" && document.getElementById("signup_password").value != "" && validateEmail(document.getElementById("signup_email").value)) {
    return true; 
  } else {displayError("Please check your input.", "signup"); return false;}
} else {
  if (validateEmail(document.getElementById("login_email").value) && document.getElementById("login_password").value != "") {
    return true; 
  } else {displayError("Please check your input. The first field should contain a valid email address!", "signup"); return false;}
}
}

let questions = [["How many people live on Mars?", "0"], ["How many people live on earth (in Billion)?", "8"], 
["How many legs does a typical dog have?", "4"], ["How many sides does a square have?", "4"], ["How many days make up one week?", "7"], ["How many poles does Earth have?", "2"],
["How many hemispheres does Earth have?", "2"], ["How many moons does Earth have? ", "1"], ["How many years make up half a decade?", "5"],
["How many sides does a hexagon have?", "6"]];

let randomQuestionIndex;

function randomQuestion() {
  randomQuestionIndex = Math.floor(Math.random() * 10);
  document.getElementById("captchaHeader").innerHTML = questions[randomQuestionIndex][0];
}

//validate answer to captcha question
function validateQuestion() {
  if (document.getElementById("captchaQuestion").value == questions[randomQuestionIndex][1]) {
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
      registerUser(signupUsername.value, signupEmail.value, signupPassword.value, "signup") }
      else {
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
    } else if (keyName === "Enter" && signupForm.style.display != "none") {
      signUpAction();
    }
  },
  false
);

//Toggle password field visability ------------
document.querySelector('.toggle-password').addEventListener('click', function() {
  const passwordInput = document.getElementById('signup_password');
  const icon = this;

  if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.remove('hide-eye');
      icon.classList.add('show-eye');
  } else {
      passwordInput.type = 'password';
      icon.classList.remove('show-eye');
      icon.classList.add('hide-eye');
  }
});


//Google Analytics 4 (simplified implementation) -------------------------------------------------------------------------
window['gtag_enable_tcf_support'] = true;

const imported = document.createElement('script');
imported.src = "https://www.googletagmanager.com/gtag/js?id=G-DXD64B7ZDX";
document.head.appendChild(imported);

try {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }

    gtag('js', new Date());

    gtag('config', 'G-DXD64B7ZDX', {
        cookie_domain: location.hostname,
        cookie_flags: "SameSite=None; Secure",
    });
} catch (error) {
    console.error("Error loading GA4: " + error);
}

