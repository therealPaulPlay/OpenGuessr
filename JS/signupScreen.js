import { loginUser, registerUser } from "./userAPI.js"

//toggle between login and signup ---------------------------------------------------------------------------------------------
function toggleForm() {
  let loginForm = document.getElementById("loginForm");
  let signupForm = document.getElementById("signupForm");
  signupStage = 1;

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

let signupStage = 1;

setSignupStage();

function setSignupStage() {
  document.getElementById("signup").innerHTML = "Signup (" + signupStage + "/2)";
  if (signupStage == 2){
    document.getElementById("signup_area").style.display = "none";
    document.getElementById("captcha").style.display = "block";
} else {
  document.getElementById("signup_area").style.display = "visible";
  document.getElementById("captcha").style.display = "none";
}
}


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
signupButtonSignupPage.addEventListener("click", function() { 
  if (signupStage == 2) {
  registerUser(signupUsername.value, signupEmail.value, signupPassword.value, errorMessage) }
  else {
    signupStage = 2;
    setSignupStage();
  }
  });

