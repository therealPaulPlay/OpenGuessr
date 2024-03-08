import { displayError, loginUser, registerUser } from "./userAPI.js"

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
    document.getElementById("title2").innerHTML = "Captcha";
    randomQuestion();
} else {
  document.getElementById("signup_area").style.display = "block";
  document.getElementById("captcha").style.display = "none";
  document.getElementById("back").style.display = "none";
  document.getElementById("title2").innerHTML = "Signup";
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
  } else {displayError("Please check our input.", "signup"); return false;}
} else {
  if (validateEmail(document.getElementById("login_email").value) && document.getElementById("login_password").value != "") {
    return true; 
  } else {displayError("Please check your input.", "signup"); return false;}
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

let errorMessage = document.getElementById("errorMessage");

let loginButtonSignupPage = document.getElementById("login");
loginButtonSignupPage.addEventListener("click", function() { 
  if (checkEmptyFields(false)) {
  loginUser(loginEmail.value, loginPassword.value, "signup")
}});

let signupButtonSignupPage = document.getElementById("signup");
signupButtonSignupPage.addEventListener("click", function() { 
  if (signupStage == 2 && validateQuestion()) {
  registerUser(signupUsername.value, signupEmail.value, signupPassword.value, "signup") }
  else {
    if (checkEmptyFields(true)) {
    signupStage = 2;
    setSignupStage();
    }
  }
  });

