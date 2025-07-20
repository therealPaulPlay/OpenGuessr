import { errorPopup } from "$lib/utils/errorHandling";
import { experience } from "$lib/stores/accountStore";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import inIframe from "$lib/utils/checkIframe";
import { get } from "svelte/store";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { signupMessageColor, signupMessageShown, signupMessageText, signupMessageTimeout } from "$lib/stores/context-specific/signupStore";

const accountRoute = get(accountUrl) + "/accounts";
const loginEndpoint = `${accountRoute}/login`;
const deleteAccountEndpoint = `${accountRoute}/delete`;
const registrationEndpoint = `${accountRoute}/register`;
const userUpdateEndpoint = `${accountRoute}/update`;
const userGetEndpoint = `${accountRoute}/user`;
const passwordResetEmailEndpoint = `${accountRoute}/reset-password-request`;
const passwordChangeEndpoint = `${accountRoute}/reset-password`;
const supporterLeaderboardEndpoint = `${accountRoute}/supporter-leaderboard`;

// Login and registration -----------------------------------------------------------------------------------
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
      displayError("Login failed: " + response.status, errorSource, responseError);
    }
  } catch (error) {
    console.error('Error occurred during login: ', error);
    displayError("Error occured during login: " + error, errorSource);
  }
}

export async function registerUser(userName, email, password, token, errorSource, successFunction) {
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
      if (typeof successFunction == "function") successFunction?.("Registration successful!");

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
export async function sendPasswordResetEmail(email, errorSource, successFunction) {
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
      successFunction?.("Password reset email sent!");

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
export async function changePassword(token, newPassword, errorSource, successFunction) {
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
      successFunction?.("Password changed successfully!");

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

// Get and Set game-related user info -----------------------------------------------------------------------------
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
      return data.user;

    } else {
      let responseError = await attemptExtractErrorFromResponse(response);

      if (response.status == 404) {
        showConfirmPopup("Account removed", "This account was removed. Your locally saved account data should be deleted to avoid issues. Continue?", () => {
          localStorage.removeItem("id");
          localStorage.removeItem("bearer");
          window.location.reload();
        }, false, false, false, "Continue");
      } else {
        throw new Error(responseError || response.status);
      }
    }
  } catch (error) {
    console.error('Error fetching the user: ', error);
    displayError("Error fetching the user: " + error, errorSource);
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
      console.error('Username update failed: ', response.status);
      displayError("Username update failed: " + response.status, errorSource, responseError);
    }

    return (response.ok); // return true / false

  } catch (error) {
    console.error('Error occurred during username update: ', error);
    displayError("Error occured during username update " + error, errorSource);
  }
}

// Error catching ----------------------------------------------------------------------------------------
export function displayError(errorTitle = "", source, errorMsg = "") {
  if (source == "signup") {
    clearTimeout(get(signupMessageTimeout));
    signupMessageShown.set(true);
    signupMessageColor.set("#ffaeae");
    signupMessageText.set(errorTitle + (errorMsg ? " – " + errorMsg : ""));

    signupMessageTimeout.set(setTimeout(() => {
      signupMessageShown.set(false);
    }, 7000));

  } else if (source == "index") {
    if (!errorMsg) errorPopup("Backend error", "The server experienced an error. Please check your internet connection and the status page.", errorTitle, false);
    else errorPopup("Backend error", errorMsg, errorTitle, false);
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