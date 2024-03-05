import { loginUser, registerUser } from "./userAPI.js"

//toggle between login and signup ---------------------------------------------------------------------------------------------
function toggleForm() {
  let loginForm = document.getElementById("loginForm");
  let signupForm = document.getElementById("signupForm");

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

let loginSwitchBack = document.getElementById("loginSwitchBack");
loginSwitchBack.addEventListener("click", toggleForm);


//Signup and login ----------------------------------------------------------------------------------------------------------

let loginEmail = document.getElementById("login_email");
let loginPassword = document.getElementById("login_password");

let signupEmail = document.getElementById("signup_email");
let signupPassword = document.getElementById("signup_password");
let signupUsername = document.getElementById("signup_username");

let errorMessage = document.getElementById("errorMessage");

let loginButtonSignupPage = document.getElementById("login");
loginButtonSignupPage.addEventListener("click", function() { loginUser(loginEmail.value, loginPassword.value, errorMessage) });

let signupButtonSignupPage = document.getElementById("signup");
signupButtonSignupPage.addEventListener("click", function() { registerUser(signupUsername.value, signupEmail.value, signupPassword.value, errorMessage) });

