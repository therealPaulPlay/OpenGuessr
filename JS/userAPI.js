import { errorPopup } from "./errorHandling.js";

export const backendURL = "https://api.openguessr.com/api";
export const loginEndpoint = `${backendURL}/users/login`;
export const registrationEndpoint = `${backendURL}/users/register`;
export const userUpdateEndpoint = `${backendURL}/users/update`;
export const userGetEndpoint = `${backendURL}/users`;

export async function loginUser(email, password, errorSource) {
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
      await saveUserData(data);

      window.location.href = "/index.html";
      //implement response save
    } else {

      console.error('Login failed:', response.status);
      displayError("Login failed: " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
    displayError("Error occured during login: " + error, errorSource);
  }
}

export async function registerUser(userName, email, password, errorSource) {
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
      localStorage.setItem("RegistrationSuccess", "success");
      window.location.reload();
    } else {
      console.error('Registration failed:', response.status);
      displayError("Registration failed: " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred during registration:', error);
    displayError("Error occured during registration: " + error, errorSource);
  }
}

export async function getUser(token, id, errorSource) {
  try {
    const response = await fetch(`${userGetEndpoint}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      await saveUserData(data['user']);
  
    } else {
      console.error('Fetch failed:', response.status);
      displayError("Fetch failed: " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred while fetching the user:', error);
    displayError("Error occurred while fetching the user: " + error, errorSource);
  }
}

export async function getAllUsers() {
  try {
    let id = localStorage.getItem("id")
    let leaderboardEndpoint = userGetEndpoint+"/leaderboard";
    if (id != null && id != 0 && id != undefined)
      userGetEndpoint + id;

    const response = await fetch(`${leaderboardEndpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      return data;
  
    } else {
      console.error('Fetch failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred while fetching the user:', error);
  }
}

export async function updatePassword(token, id, errorSource) {
  try {
    const response = await fetch(`${userGetEndpoint}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      saveUserData(data);
    } else {
      console.error('Fetch failed:', response.status);
      displayError("Fetch failed: " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred while fetching the user:', error);
    displayError("Error occured while fetching the user: " + error, errorSource);
  }
}

export async function updateExperience(token, id, experience, errorSource) {
  try {
    const requestBody = {
      id: id,
      experience: experience
    };
    // Make the PUT request using Fetch API
    const response = await fetch(userUpdateEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("experience", data['user']['experience']);
    } else {
      console.error('User update failed:', response.status);
      displayError("User update failed: " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred during user update:', error);
    displayError("Error occured during user update: " + error, errorSource);
  }
}

export async function updateUsername(token, id, requestedUsername, errorSource) {
  try {

    const requestBody = {
      id: id,
      userName: requestedUsername
    }

    // Make the PUT request using Fetch API
    const response = await fetch(userUpdateEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("username", data['user']['userName']);
    } else {
      console.error('User update failed:', response.status);
      displayError("User update failed " + response.status, errorSource);
    }
  } catch (error) {
    console.error('Error occurred during user update:', error);
    displayError("Error occured during user update " + error, errorSource);
  }
}


//executed after successful login
async function saveUserData(data) {
  if (data['access_token'] && data['id']) {
    localStorage.setItem("bearer", data['access_token']);
    localStorage.setItem("id", data['id']);
  } 
  localStorage.setItem("username", data['userName']);
  localStorage.setItem("experience", data['experience']);
}

export function displayError(error, source) {
  if (source == "signup") {
    //special cases
    if (error.includes("400")) {
      error = "Wrong credentials.";
    }
    if (error.includes("409")) {
      error = "User with this email or username already exists.";
    }
    
    errorMessage.innerHTML = error;
    errorMessage.style.display = "inline";
    errorMessage.style.color = "red";

  } else if (source == "index") {
    errorPopup("User API Error", "The User API reports an error. Please consider signing out and logging in again to resolve the issue.", error, false)
  } else {
        //error will be displayed anyway - see functions above
        console.log("No element for displaying the error passed as an argument.");
  }
}

export function displaySuccess() {
  errorMessage.innerHTML = "Registration successful! Please log in.";
  errorMessage.style.display = "inline";
  errorMessage.style.color = "#64c681";

}

if (localStorage.getItem("RegistrationSuccess") == "success") {
  displaySuccess();
  localStorage.removeItem("RegistrationSuccess");
}
