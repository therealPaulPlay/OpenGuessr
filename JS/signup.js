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

let loginButtonSingupPage = document.getElementById("login"); 
loginButtonSingupPage.addEventListener("click", login);

let signupButtonSignupPage = document.getElementById("signup"); 
signupButtonSignupPage.addEventListener("click", signup);

function login() {
    //login logic, if success, go back to main page
    window.location.href = "/index.html";
    console.log("logged in");
}

function signup() {
    //signup logic, if success, go back to main page
    window.location.href = "/index.html";
    console.log("signed up");
}