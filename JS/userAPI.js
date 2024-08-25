import { errorPopup } from "./errorHandling.js";

export const backendURL = "https://accounts.openguessr.com/accounts";
export const loginEndpoint = `${backendURL}/login`;
export const deleteAccountEndpoint = `${backendURL}/delete`;
export const registrationEndpoint = `${backendURL}/register`;
export const userUpdateEndpoint = `${backendURL}/update`;
export const userGetEndpoint = `${backendURL}/user`;
export const leaderboardEndpoint = `${backendURL}/leaderboard`;
export const passwordResetEmailEndpoint = `${backendURL}/reset-password-request`;
export const passwordChangeEndpoint = `${backendURL}/reset-password`;
export const supporterLeaderboardEndpoint = `${backendURL}/supporter-leaderboard`;

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

//Login and registration -----------------------------------------------------------------------------------
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
      saveUserData(data);

      if (inIframe()) {
        window.top.postMessage("close", "*");
        window.top.postMessage("loadAccountStatus", "*");
      } else {
        window.location.href = "/index.html";
      }
    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Login failed:', response.status);
      displayError("Login failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Error occurred during login: ', error);
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
      displaySuccess("Registration successful! Please log in.");
    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Registration failed: ', response.status);
      displayError("Registration failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Error occurred during registration: ', error);
    displayError("Error occured during registration: " + error, errorSource);
  }
}

// Delete user 
export async function deleteUser(id, password, errorSource) {
  try {
    const requestBody = {
      id: id,
      password: password
    };

    // Make the POST request using Fetch API
    const response = await fetch(deleteAccountEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      return true;

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Account deletion failed:', response.status);
      displayError("Account deletion failed: " + response.status, errorSource, responseError);
      return false;
    }
  } catch (error) {
    console.error('Error occurred during account deletion: ', error);
    displayError("Error occured during account deletion: " + error, errorSource);
    return false;
  }
}

// Send reset email
export async function sendPasswordResetEmail(email, errorSource) {
  try {
    const requestBody = {
      email: email
    };

    // Make the POST request using Fetch API
    const response = await fetch(passwordResetEmailEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      displaySuccess("Password reset email sent!");

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Password reset request failed:', response.status);
      displayError("Password reset request failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Error occurred during password reset request: ', error);
    displayError("Error occured during password reset request: " + error, errorSource);
  }
}

// Change password with reset token
export async function changePassword(token, newPassword, errorSource) {
  try {
    const requestBody = {
      token: token,
      newPassword
    };

    // Make the POST request using Fetch API
    const response = await fetch(passwordChangeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      displaySuccess("Password changed successfully!");

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Password change failed:', response.status);
      displayError("Password change failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Password change failed: ', error);
    displayError("Password change failed: " + error, errorSource);
  }
}

//Get and Set game-related user info -----------------------------------------------------------------------------
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
      saveUserData(data['user']);
      return data.user;

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Fetch failed:', response.status);
      displayError("Fetch failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Error occurred while fetching the user: ', error);
    displayError("Error occurred while fetching the user: " + error, errorSource);
  }
}

export async function getLeaderboard() {
  try {
    let id = localStorage.getItem("id")
    let editLeaderboardEndpoint = leaderboardEndpoint;
    if (id != null && id != 0 && id != undefined) {
      editLeaderboardEndpoint = `${leaderboardEndpoint}/${id}`;
    }

    const response = await fetch(`${editLeaderboardEndpoint}`, {
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
    console.error('Error occurred while fetching the user: ', error);
  }
}

export async function getSupporterLeaderboard() {
  try {
    const response = await fetch(supporterLeaderboardEndpoint, {
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
    console.error('Error occurred while fetching the user: ', error);
  }
}

export async function updateExperience(token, id, experience, errorSource, secondAttempt) {
  try {
    const requestBody = {
      id: id,
      experience: experience
    };

    const experienceEndpoint = userUpdateEndpoint + "/experience";
    // Make the PUT request using Fetch API
    const response = await fetch(experienceEndpoint, {
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
      if (response.status != 400 || secondAttempt) {
        let responseError = await attemptExtractErrorFromResponse(response);
        console.error('User update failed:', response.status);
        displayError("User update failed: " + response.status, errorSource, responseError);
      } else {
        return "retry";
      }
    }
  } catch (error) {
    console.error('Error occurred during user update: ', error);
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
    const response = await fetch(userUpdateEndpoint + "/username", {
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
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('User update failed: ', response.status);
      displayError("User update failed: " + response.status, errorSource, responseError);
    }

    return (response.ok); // return true / false

  } catch (error) {
    console.error('Error occurred during user update: ', error);
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

//Error catching ----------------------------------------------------------------------------------------
let timeout;

export function displayError(error, source, errorMsg) {
  if (!error) {
    error = "";
  }

  if (!errorMsg) {
    errorMsg = "";
  }
  if (source == "signup") {

    try {
      errorMessage.innerHTML = error + " - " + errorMsg;

      // make error message visible in case it isn't
      clearTimeout(timeout);
      errorMessage.style.maxHeight = "100px";
      errorMessage.style.marginTop = "20px";
      errorMessage.style.marginBottom = "20px";
      errorMessage.style.opacity = "1";
      errorMessage.style.color = "#ffaeae";

      if (!errorMsg) {
        errorMessage.innerHTML = error;
      }

      timeout = setTimeout(() => {
        errorMessage.style.maxHeight = "0";
        errorMessage.style.opacity = "0";
        errorMessage.style.margin = "0";
      }, 7000);
    } catch { }

  } else if (source == "index") {
    if (!errorMsg) {
      errorPopup("Account Backend Error", "The API reports an unknown error. Please consider reporting this in #bug-reports on the Discord.", error, false);
    } else {
      errorPopup("Account Backend Error", "Error: " + errorMsg, error, false);
    }

  } else {
    //error will be displayed anyway - see functions above
    console.log("No element for displaying the error passed as an argument.");
  }
}

export function displaySuccess(text) {
  try {
    clearTimeout(timeout);
    errorMessage.innerHTML = text;
    errorMessage.style.maxHeight = "100px";
    errorMessage.style.marginTop = "20px";
    errorMessage.style.marginBottom = "20px";
    errorMessage.style.opacity = "1";
    errorMessage.style.color = "#64c681";
    
    // change to sign-in
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("resetForm").style.display = "none";
    document.getElementById("newPasswordForm").style.display = "none";

    timeout = setTimeout(() => {
      errorMessage.style.maxHeight = "0";
      errorMessage.style.opacity = "0";
      errorMessage.style.margin = "0";
    }, 4000);
  } catch { }
}

export async function attemptExtractErrorFromResponse(response) {
  try {
    const data = await response.json();
    return data.error;
  } catch {
    return null;
  }
}

