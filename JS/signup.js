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

let loginButtonSignupPage = document.getElementById("login"); 
loginButtonSignupPage.addEventListener("click", function() {loginUser(loginEmail.value, loginPassword.value)});

let signupButtonSignupPage = document.getElementById("signup"); 
signupButtonSignupPage.addEventListener("click", function() {registerUser(signupUsername.value, signupEmail.value, signupPassword.value)});

const backendURL = "http://localhost:8080/api";
const loginEndpoint = `${backendURL}/users/login`;
const registrationEndpoint = `${backendURL}/users/register`; 
const userUpdateEndpoint = `${backendURL}/users/update`;
const userGetEndpoint =  `${backendURL}/users`;

async function loginUser(email, password) {
    try {
      const requestBody = {
        email: email,
        password: password
      };
  
      // Make the POST request using Fetch API
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      // Check if the response is successful
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        window.href = "/index.html";
        //implement response save
      } else {
  
        console.error('Login failed:', response.status);
      }
    } catch (error) {
      console.error('Error occurred during login:', error);
    }
  }

  async function registerUser(userName, email, password) {
    try {
      // Define the request body
      const requestBody = {
        userName: userName,
        email: email,
        password: password
      };
  
      // Make the POST request using Fetch API
      const response = await fetch(registrationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      // Check if the response is successful
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        window.href = "/index.html";
      } else {
        console.error('Registration failed:', response.status);
      }
    } catch (error) {
      console.error('Error occurred during registration:', error);
    }
  }

//Error Messages ------------------------------------

let errorMessage = document.getElementById("errorMessage");

function displayError(error) {
    errorMessage.innerHTML = error;
    errorMessage.style.display = "inline";
}
