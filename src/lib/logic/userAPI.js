import { errorPopup } from "$lib/utils/errorHandling";
import { experience } from "$lib/stores/accountStore";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import inIframe from "$lib/utils/checkIframe";

export const backendURL = "https://accounts.openguessr.com/accounts";
export const loginEndpoint = `${backendURL}/login`;
export const deleteAccountEndpoint = `${backendURL}/delete`;
export const registrationEndpoint = `${backendURL}/register`;
export const userUpdateEndpoint = `${backendURL}/update`;
export const userGetEndpoint = `${backendURL}/user`;
export const leaderboardEndpoint = `${backendURL}/leaderboard`;
export const userLeaderboardEndpoint = `${backendURL}/user-leaderboard`;
export const passwordResetEmailEndpoint = `${backendURL}/reset-password-request`;
export const passwordChangeEndpoint = `${backendURL}/reset-password`;
export const supporterLeaderboardEndpoint = `${backendURL}/supporter-leaderboard`;

// Login and registration -----------------------------------------------------------------------------------
export async function loginUser(email, password, errorSource, errorElement) {
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

      // Important: Save the Token and ID, to enable future requests
      if (data['token'] && data['id']) {
        localStorage.setItem("bearer", data['token']);
        localStorage.setItem("id", data['id']);
      }

      if (inIframe()) {
        window.parent.postMessage("loadAccountStatus", "*");
        window.parent.postMessage(`id ${data['id']}`, "*");
        window.parent.postMessage(`token ${data['token']}`, "*");
        window.parent.postMessage("close", "*");
      } else {
        if (document.referrer) {
          window.history.back();
        } else {
          window.location.href = "/";  // Fallback if no referrer
        }
      }
    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Login failed:', response.status);
      displayError("Login failed: " + response.status, errorSource, errorElement, responseError);
    }
  } catch (error) {
    console.error('Error occurred during login: ', error);
    displayError("Error occured during login: " + error, errorSource, errorElement);
  }
}

export async function registerUser(userName, email, password, token, errorSource, successFunction, errorElement) {
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
        'Content-Type': 'application/json',
        'cf-turnstile-response': token
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      if (typeof successFunction == "function") successFunction("Registration successful! Please log in.");

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Registration failed: ', response.status);
      displayError("Registration failed: " + response.status, errorSource, errorElement, responseError);
    }
  } catch (error) {
    console.error('Error occurred during registration: ', error);
    displayError("Error occured during registration: " + error, errorSource, errorElement);
  }
}

// Delete user 
export async function deleteUser(id, password, errorSource, errorElement) {
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
      displayError("Account deletion failed: " + response.status, errorSource, errorElement, responseError);
      return false;
    }
  } catch (error) {
    console.error('Error occurred during account deletion: ', error);
    displayError("Error occured during account deletion: " + error, errorElement, errorSource);
    return false;
  }
}

// Send reset email
export async function sendPasswordResetEmail(email, errorSource, successFunction, errorElement) {
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
      if (typeof successFunction != "function") return;
      successFunction("Password reset email sent!");

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Password reset request failed:', response.status);
      displayError("Password reset request failed: " + response.status, errorSource, errorElement, responseError);
    }
  } catch (error) {
    console.error('Error occurred during password reset request: ', error);
    displayError("Error occured during password reset request: " + error, errorSource, errorElement);
  }
}

// Change password with reset token
export async function changePassword(token, newPassword, errorSource, successFunction, errorElement) {
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
      if (typeof successFunction != "function") return;
      successFunction("Password changed successfully!");

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Password change failed:', response.status);
      displayError("Password change failed: " + response.status, errorSource, errorElement, responseError);
    }
  } catch (error) {
    console.error('Password change failed: ', error);
    displayError("Password change failed: " + error, errorSource, errorElement);
  }
}

// Get and Set game-related user info -----------------------------------------------------------------------------
export async function getUser(token, id, errorSource, errorElement) {
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
      return data.user;

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('Fetch failed:', response.status);
      if (response.status == 404) {
        showConfirmPopup("Account removed", "This account was removed by an admin. If this was a test account, it was likely modifed / re-created by staff during tests. Your locally saved account data should be deleted to avoid issues. Continue?", () => {
          localStorage.removeItem("id");
          localStorage.removeItem("bearer");
          window.location.reload();
        }, false, false, false, "Continue");
      } else {
        displayError("Fetch failed: " + response.status, errorSource, errorElement, responseError);
      }
    }
  } catch (error) {
    console.error('Error occurred while fetching the user: ', error);
    displayError("Error occurred while fetching the user: " + error, errorSource, errorElement);
  }
}

export async function getLeaderboard() {
  try {

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
    console.error('Error occurred while fetching the user: ', error);
  }
}

export async function getUserLeaderboard() {
  try {
    let id = localStorage.getItem("id");
    let editLeaderboardEndpoint = `${userLeaderboardEndpoint}/${id}`;

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

export async function updateExperience(token, id, experienceParam, errorSource, errorElement) {
  try {
    const requestBody = {
      id: id,
      experience: experienceParam
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
      experience.set(data?.user?.experience);
    } else {
      let responseError = await attemptExtractErrorFromResponse(response);
      console.error('User update failed:', response.status);
      displayError("User update failed: " + response.status, errorSource, errorElement, responseError);
    }
  } catch (error) {
    console.error('Error occurred during user update: ', error);
    displayError("Error occured during user update: " + error, errorSource, errorElement);
  }
}

export async function updateUsername(token, id, requestedUsername, errorSource, errorElement) {
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
      displayError("User update failed: " + response.status, errorSource, errorElement, responseError);
    }

    return (response.ok); // return true / false

  } catch (error) {
    console.error('Error occurred during user update: ', error);
    displayError("Error occured during user update " + error, errorSource, errorElement);
  }
}

// Error catching ----------------------------------------------------------------------------------------
let timeout;

export function displayError(error, source, errorMessageElement, errorMsg) {
  if (!error) {
    error = "";
  }

  if (!errorMsg) {
    errorMsg = "";
  }

  if (source == "signup") {

    if (!errorMessageElement) {
      console.error("No errorMessageElement in displayError function! Needed for Signup-Page errors.");
      return;
    }

    try {
      errorMessageElement.innerHTML = error + " - " + errorMsg;

      // make error message visible in case it isn't
      clearTimeout(timeout);
      errorMessageElement.style.maxHeight = "100px";
      errorMessageElement.style.marginTop = "20px";
      errorMessageElement.style.marginBottom = "20px";
      errorMessageElement.style.opacity = "1";
      errorMessageElement.style.color = "#ffaeae";

      if (!errorMsg) {
        errorMessageElement.innerHTML = error;
      }

      timeout = setTimeout(() => {
        errorMessageElement.style.maxHeight = "0";
        errorMessageElement.style.opacity = "0";
        errorMessageElement.style.margin = "0";
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

export async function attemptExtractErrorFromResponse(response) {
  try {
    const data = await response.json();
    return data.error;
  } catch {
    return null;
  }
}