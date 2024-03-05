export const backendURL = "http://localhost:8080/api";
export const loginEndpoint = `${backendURL}/users/login`;
export const registrationEndpoint = `${backendURL}/users/register`;
export const userUpdateEndpoint = `${backendURL}/users/update`;
export const userGetEndpoint = `${backendURL}/users`;

export async function loginUser(email, password, htmlElement) {
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
      await saveUserData(data);

      window.location.href = "/index.html";
      //implement response save
    } else {

      console.error('Login failed:', response.status);
      displayError("Login failed: " + response.status, htmlElement);
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
    displayError("Error occured during login: " + error, htmlElement);
  }
}

export async function registerUser(userName, email, password, htmlElement) {
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
      toggleForm(); //switch to login form after successful registration
    } else {
      console.error('Registration failed:', response.status);
      displayError("Registration failed: " + response.status, htmlElement);
    }
  } catch (error) {
    console.error('Error occurred during registration:', error);
    displayError("Error occured during registration: " + error, htmlElement);
  }
}

export async function getUser(id, bearer, htmlElement) {
  try {
    const response = await fetch(`${userGetEndpoint}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`
      },
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      saveUserData(data);
    } else {
      console.error('Fetch failed:', response.status);
      displayError("Fetch failed:" + response.status, htmlElement);
    }
  } catch (error) {
    console.error('Error occurred while fetching the user:', error);
    displayError("Error occured while fetching user: " + error, htmlElement);
  }
}

export async function updateExperience(token, id, experience) {
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
      console.log('User update successful:', data);
    } else {
      console.error('User update failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during user update:', error);
  }
}

export async function updateUsername(token, id, requestedUsername) {
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
      console.log('User update successful:', data);
    } else {
      console.error('User update failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during user update:', error);
  }
}


//executed after successful login
async function saveUserData(data) {
  localStorage.setItem("bearer", data['access_token']);
  localStorage.setItem("id", data['id']);
  localStorage.setItem("username", data['username']);
  localStorage.setItem("experience", data['experience']);
}

export function displayError(error, htmlElement) {
  htmlElement.innerHTML = error;
  htmlElement.style.display = "inline";
}
